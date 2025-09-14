const express = require('express');
const jwt =require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email });

    if (user && !user.password) {
        return res.status(401).json({ message: 'This account was created using Google Sign-In. Please use the "Continue with Google" button.' });
    }

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// @route   GET /api/auth/google
// @desc    Initiate Google OAuth flow
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));


// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback URL
// @access  Public
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}?error=google-auth-failed` }), (req, res) => {
    // On successful authentication, Passport attaches the user to req.user.
    // We generate a token for this user.
    const token = generateToken(req.user._id);
    
    // Create a user object to send back, including the token.
    const userResponse = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        token: token
    };

    // Redirect back to the frontend, passing the user object and token as a query parameter.
    const userQueryParam = encodeURIComponent(JSON.stringify(userResponse));
    res.redirect(`${process.env.FRONTEND_URL}?user=${userQueryParam}&token=${token}`);
});


module.exports = router;
