
const express = require('express');
const { GoogleGenAI, Modality } = require('@google/genai');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// --- SERVICE CONFIGURATION ---
// Initialize Google Gemini client (requires API_KEY)
if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// @route   POST /api/gemini/edit-image
// @desc    Edit an image with a text prompt using Google Gemini
// @access  Private
router.post('/edit-image', protect, async (req, res) => {
  const { base64ImageData, mimeType, prompt, model } = req.body;

  if (!base64ImageData || !mimeType || !prompt || !model) {
    return res.status(400).json({ message: 'Missing required fields for image editing.' });
  }

  if (!process.env.API_KEY) {
    return res.status(500).json({ message: "Image editing service is not configured on the server." });
  }

  try {
    const response = await ai.models.generateContent({
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
    let newImageBase64 = null;
    let text = null;

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                newImageBase64 = part.inlineData.data;
            } else if (part.text) {
                text = part.text;
            }
        }
    }
    
    // Send the result back to the frontend
    res.json({ newImageBase64, text });

  } catch (error) {
    console.error("Error calling Gemini API for image editing:", error);
    res.status(500).json({ message: "Failed to communicate with the AI model for image editing. Please try again." });
  }
});


// @route   POST /api/gemini/generate-video
// @desc    Generates a video from a prompt using Google Gemini
// @access  Private
router.post('/generate-video', protect, async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'A prompt is required to generate a video.' });
    }

    if (!process.env.API_KEY) {
      return res.status(500).json({ message: "Video generation service is not configured on the server." });
    }

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1
            }
        });

        // Poll for completion, waiting 10 seconds between checks.
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (!downloadLink) {
          throw new Error("Video generation completed but no video URI was found.");
        }
        
        // Fetch the video from the signed URL provided by the Gemini API.
        // The API key must be appended to the URL.
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        
        if (!videoResponse.ok) {
            const errorBody = await videoResponse.text();
            throw new Error(`Failed to fetch video from generated URI. Status: ${videoResponse.status}. Body: ${errorBody}`);
        }
        
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        // Stream the video file back to the client
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', videoBuffer.length);
        res.send(videoBuffer);

    } catch (error) {
        console.error("Error calling Gemini API for video generation:", error);
        res.status(500).json({ message: "Failed to generate video. This can take several minutes. If it fails, please try again." });
    }
});

module.exports = router;