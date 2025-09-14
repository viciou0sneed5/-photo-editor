const express = require('express');
const cors = 'cors');
const dotenv = require('dotenv');
const passport = require('passport');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Passport config
require('./config/passport')(passport);

// Connect to the database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json({ limit: '10mb' })); // To handle large base64 image strings

// Passport middleware
app.use(passport.initialize());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gemini', require('./routes/geminiRoutes'));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
