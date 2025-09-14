
const express = require('express');
const { GoogleGenAI, Modality } = require('@google/genai');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Initialize the Google AI client
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set on the server");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// @route   POST /api/gemini/edit-image
// @desc    Edit an image with a text prompt
// @access  Private
router.post('/edit-image', protect, async (req, res) => {
  const { base64ImageData, mimeType, prompt, model } = req.body;

  if (!base64ImageData || !mimeType || !prompt || !model) {
    return res.status(400).json({ message: 'Missing required fields for image editing.' });
  }

  try {
    const genAIResponse = await ai.models.generateContent({
      model: model, // e.g., 'gemini-2.5-flash-image-preview'
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    // Process the response from Gemini
    const { candidates } = genAIResponse;
    let newImageBase64 = null;
    let text = null;

    if (candidates && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) newImageBase64 = part.inlineData.data;
        else if (part.text) text = part.text;
      }
    }
    
    res.json({ newImageBase64, text });

  } catch (error) {
    console.error("Error calling Gemini API for image editing:", error);
    res.status(500).json({ message: "Failed to communicate with the AI model for image editing." });
  }
});


// @route   POST /api/gemini/generate-video
// @desc    Generate a video from a prompt and optional image
// @access  Private
router.post('/generate-video', protect, async (req, res) => {
    const { prompt, startImage } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'A prompt is required to generate a video.' });
    }

    try {
        const videoRequest = {
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: { numberOfVideos: 1 }
        };

        if (startImage) {
            videoRequest.image = {
                imageBytes: startImage.base64,
                mimeType: startImage.mimeType,
            };
        }
        
        // Start the video generation operation
        let operation = await ai.models.generateVideos(videoRequest);
        
        // Poll for the result
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
             return res.status(500).json({ message: 'Video generation completed, but no download link was found.' });
        }
        
        // Return the final, authenticated download URI to the frontend
        res.json({ videoUrl: `${downloadLink}&key=${process.env.API_KEY}` });

    } catch (error) {
        console.error("Error calling Gemini API for video generation:", error);
        res.status(500).json({ message: "Failed to communicate with the AI model for video generation." });
    }
});

module.exports = router;