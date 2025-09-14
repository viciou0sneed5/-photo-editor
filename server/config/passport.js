const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback', // This must match the authorized redirect URI in Google Console
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        // This function is called after the user successfully authenticates with Google.
        const newUser = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        };

        try {
          // Check if user already exists in our database
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists, log them in
            return done(null, user);
          } 
          
          // If user doesn't exist with googleId, check if they signed up with email before
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            // User exists with email, link their Google account
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }

          // If user doesn't exist at all, create a new user
          user = await User.create(newUser);
          return done(null, user);

        } catch (err) {
          console.error("Error in Google OAuth strategy:", err);
          return done(err, false);
        }
      }
    )
  );
};
