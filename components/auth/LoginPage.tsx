
import React, { useState, useContext } from 'react';
import { SparklesIcon, MailIcon, LockIcon, GoogleIcon } from '../Icons';
import { AuthContext } from '../../contexts/AuthContext';
import { login as apiLogin } from '../../services/authService';

interface LoginPageProps {
  onNavigateToSignup: () => void;
}

export default function LoginPage({ onNavigateToSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, continueWithGoogle } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const user = await apiLogin(email, password);
      login(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await continueWithGoogle();
    } catch (err) {
       setError(err instanceof Error ? err.message : 'An unknown error occurred.');
       setIsLoading(false);
    }
    // No need to set loading to false on success, as the app will transition away.
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-block p-3 bg-indigo-600 rounded-xl mb-4">
                <SparklesIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
            <p className="text-indigo-300">Sign in to access the AI Creative Suite</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
                <MailIcon className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                />
            </div>
            <div className="relative">
                <LockIcon className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                />
            </div>

            {error && <p className="text-red-400 text-sm text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
            
            <button type="submit" disabled={isLoading} className="w-full py-3 px-6 text-lg font-semibold rounded-lg transition-all duration-300 bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-gray-600">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
            </div>
          </div>
          
          <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-3 px-6 font-semibold rounded-lg transition-colors bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50">
            <GoogleIcon className="w-6 h-6" />
            Continue with Google
          </button>

          <p className="text-center text-gray-400 mt-8">
            Don't have an account?{' '}
            <button onClick={onNavigateToSignup} className="font-semibold text-indigo-400 hover:text-indigo-300">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}