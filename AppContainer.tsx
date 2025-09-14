
import React, { useState, useContext } from 'react';
import App from './App';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import OtpPage from './components/auth/OtpPage';
import { AuthContext } from './contexts/AuthContext';

type AuthScreen = 'login' | 'signup' | 'otp';

export default function AppContainer() {
  const { isAuthenticated } = useContext(AuthContext);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  
  // This state is no longer strictly necessary with the new backend flow,
  // but we'll keep it to avoid breaking the OtpPage component's props.
  const [pendingUserEmail, setPendingUserEmail] = useState<string | null>(null);

  // With the new backend, signup logs the user in directly. 
  // This handler is kept for prop consistency but the App will re-render due to
  // the AuthContext change before this is even needed.
  const handleSignupSuccess = (email: string) => {
    // No longer need to switch to OTP screen.
    // The AuthContext will update and show the main App.
  };

  if (!isAuthenticated) {
    switch (authScreen) {
      case 'signup':
        return <SignupPage onSignupSuccess={handleSignupSuccess} onNavigateToLogin={() => setAuthScreen('login')} />;
      // The OTP page is now effectively deprecated, but we keep the route for context.
      case 'otp':
        return <OtpPage userEmail={pendingUserEmail} onNavigateToLogin={() => setAuthScreen('login')} />;
      case 'login':
      default:
        return <LoginPage onNavigateToSignup={() => setAuthScreen('signup')} />;
    }
  }

  return <App />;
}