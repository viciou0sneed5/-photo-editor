
const express = require('express');
const { HfInference } = require('@huggingface/inference');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// --- SERVICE CONFIGURATION ---
// All AI models now run on the Hugging Face free tier.

// Initialize Hugging Face client (requires HUGGINGFACE_HUB_TOKEN)
if (!process.env.HUGGINGFACE_HUB_TOKEN) {
  console.warn("HUGGINGFACE_HUB_TOKEN environment variable not set. AI features will not work.");
}
const hf = new HfInference(process.env.HUGGINGFACE_HUB_TOKEN);


// @route   POST /api/gemini/edit-image
// @desc    Edit an image with a text prompt using Hugging Face
// @access  Private
router.post('/edit-image', protect, async (req, res) => {
  const { base64ImageData, prompt } = req.body;

  if (!base64ImageData || !prompt) {
    return res.status(400).json({ message: 'Missing required fields for image editing.' });
  }

  if (!process.env.HUGGINGFACE_HUB_TOKEN) {
    return res.status(500).json({ message: "Image editing service is not configured on the server." });
  }

  try {
    const imageBuffer = Buffer.from(base64ImageData, 'base64');

    const resultBlob = await hf.imageToImage({
      model: 'timbrooks/instruct-pix2pix',
      inputs: imageBuffer,
      parameters: {
        prompt: prompt,
      }
    });

    const resultBuffer = await resultBlob.arrayBuffer();
    const newImageBase64 = Buffer.from(resultBuffer).toString('base64');
    
    res.json({ newImageBase64, text: "Image edited using an open-source model via Hugging Face." });

  } catch (error) {
    console.error("Error calling Hugging Face API for image editing:", error);
    res.status(500).json({ message: "Failed to communicate with the AI model for image editing. The model may be loading, please try again in a moment." });
  }
});


// Helper to map aspect ratios to dimensions for SDXL
const getDimensionsForSdxl = (aspectRatio) => {
    switch (aspectRatio) {
        case '16:9': return { width: 1344, height: 768 };
        case '9:16': return { width: 768, height: 1344 };
        case '4:3': return { width: 1152, height: 864 };
        case '3:4': return { width: 864, height: 1152 };
        case '1:1':
        default: return { width: 1024, height: 1024 };
    }
};

// @route   POST /api/gemini/generate-images
// @desc    Generate images from a text prompt using Hugging Face
// @access  Private
router.post('/generate-images', protect, async (req, res) => {
  const { prompt, numberOfImages, aspectRatio } = req.body;

  if (!prompt || !numberOfImages) {
    return res.status(400).json({ message: 'Missing required fields for image generation.' });
  }

  if (!process.env.HUGGINGFACE_HUB_TOKEN) {
    return res.status(500).json({ message: "Image generation service is not configured on the server." });
  }

  try {
    const { width, height } = getDimensionsForSdxl(aspectRatio);

    const imagePromises = Array.from({ length: Number(numberOfImages) }, () => 
        hf.textToImage({
            model: 'stabilityai/stable-diffusion-xl-base-1.0',
            inputs: prompt,
            parameters: {
                width: width,
                height: height,
                negative_prompt: 'blurry, ugly, deformed, low quality',
            }
        })
    );

    const results = await Promise.all(imagePromises);

    const imagesAsBase64Promises = results.map(async (blob) => {
        const buffer = await blob.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
    });

    const images = await Promise.all(imagesAsBase64Promises);

    res.json({ images });

  } catch (error) {
    console.error("Error calling Hugging Face API for image generation:", error);
    res.status(500).json({ message: "Failed to communicate with the AI model for image generation. The model may be loading, please try again in a moment." });
  }
});


// @route   POST /api/gemini/generate-video
// @desc    Generates a video from a prompt using Hugging Face
// @access  Private
router.post('/generate-video', protect, async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'A prompt is required to generate a video.' });
    }

    if (!process.env.HUGGINGFACE_HUB_TOKEN) {
      return res.status(500).json({ message: "Video generation service is not configured on the server." });
    }

    try {
        const resultBlob = await hf.textToVideo({
            model: 'cerspense/zeroscope-v2-576w', // A popular free text-to-video model
            inputs: prompt,
            parameters: {
                max_frames: 24,
                num_inference_steps: 25,
            }
        });

        // Get the video data as a Buffer
        const videoBuffer = Buffer.from(await resultBlob.arrayBuffer());

        // Stream the video file back to the client
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', videoBuffer.length);
        res.send(videoBuffer);

    } catch (error) {
        console.error("Error calling Hugging Face API for video generation:", error);
        res.status(500).json({ message: "Failed to generate video. The free model may be loading or unavailable, please try again in a few minutes." });
    }
});

module.exports = router;
