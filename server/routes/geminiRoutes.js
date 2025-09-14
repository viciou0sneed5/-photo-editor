
const express = require('express');
const { GoogleGenAI, Modality } = require('@google/genai');
const { protect } = require('../middleware/authMiddleware');
const https = require('https');

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
// @desc    Starts the video generation process
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
        
        const operation = await ai.models.generateVideos(videoRequest);
        
        // Respond immediately with the operation name so the client can poll
        res.status(202).json({ operationName: operation.name });

    } catch (error) {
        console.error("Error starting Gemini video generation:", error);
        res.status(500).json({ message: "Failed to start video generation process." });
    }
});


// @route   GET /api/gemini/video-status/:operationName(*)
// @desc    Checks the status of video generation and returns the video when done
// @access  Private
router.get('/video-status/:operationName(*)', protect, async (req, res) => {
    const { operationName } = req.params;
    if (!operationName) {
        return res.status(400).json({ message: 'Operation name is required.' });
    }

    try {
        const operation = await ai.operations.getVideosOperation({ name: operationName });

        if (!operation.done) {
            return res.json({ status: 'pending' });
        }
        
        if (operation.error) {
             console.error(`Video generation failed for operation ${operationName}:`, operation.error);
             return res.status(500).json({ message: operation.error.message || 'Video generation process failed.' });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
             return res.status(500).json({ message: 'Video generation completed, but no download link was found.' });
        }
        
        const videoUrlWithKey = `${downloadLink}&key=${process.env.API_KEY}`;
        
        https.get(videoUrlWithKey, (proxyRes) => {
            if (proxyRes.statusCode >= 400) {
                 console.error(`Google storage returned error ${proxyRes.statusCode} for operation ${operationName}`);
                 if (!res.headersSent) {
                    res.status(502).json({ message: 'Failed to retrieve video from storage.' });
                 }
                 return;
            }
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        }).on('error', (e) => {
            console.error(`Error proxying video download for operation ${operationName}: ${e.message}`);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to download the generated video file.' });
            }
        });

    } catch (error) {
        console.error(`Error checking video status for operation ${operationName}:`, error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to get video generation status." });
        }
    }
});

module.exports = router;
