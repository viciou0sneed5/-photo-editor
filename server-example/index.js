// --- EXAMPLE BACKEND SERVER (server-example/index.js) ---
// This is a simplified example of what your backend could look like.
// To run this, you would need to install Node.js and the required packages (`npm install express cors @google/genai jsonwebtoken`).

const express = require('express');
const cors = require('cors');
const { GoogleGenAI, Modality } = require('@google/genai');
const jwt = require('jsonwebtoken');

// Load environment variables (e.g., from a .env file)
// require('dotenv').config();

const app = express();
app.use(cors()); // Allow requests from your frontend
app.use(express.json({ limit: '10mb' })); // To handle large base64 image strings

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'; // Replace with a strong secret

// --- IMPORTANT: API key is now only on the backend ---
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set on the server");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- AUTHENTICATION MIDDLEWARE ---
// A middleware function to protect routes. It checks for a valid JWT.
const protect = (req, res, next) => {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }

    const token = bearer.split(' ')[1].trim();
    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user; // Add user data to the request object
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
    }
};

// --- API ROUTES ---

// Example: Login route (would check password against a db hash)
app.post('/api/auth/login', (req, res) => {
    // In a real app:
    // 1. Find user in database by email (req.body.email)
    // 2. Compare hashed password with bcrypt.compare()
    // 3. If valid, create JWT
    const { email } = req.body;
    const MOCK_USER = { id: 1, email, name: 'Test User' };
    const token = jwt.sign(MOCK_USER, JWT_SECRET, { expiresIn: '1h' });
    res.json({ ...MOCK_USER, token });
});


// --- PROTECTED GEMINI API ROUTE ---
// The 'protect' middleware is used here to ensure only logged-in users can access it.
app.post('/api/gemini/edit-image', protect, async (req, res) => {
    console.log(`Request received from user: ${req.user.email}`);
    
    const { base64ImageData, mimeType, prompt, model } = req.body;

    if (!base64ImageData || !mimeType || !prompt || !model) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
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
                if (part.inlineData) newImageBase64 = part.inlineData.data;
                else if (part.text) text = part.text;
            }
        }
        
        // Send the result back to the frontend
        res.json({ newImageBase64, text });

    } catch (error) {
        console.error("Error calling Gemini API on backend:", error);
        res.status(500).json({ message: "Failed to communicate with the AI model." });
    }
});


// Add other routes for video generation, signup, etc.


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
