import React, { useState, useContext } from 'react';
import { UserIcon, MailIcon, LockIcon } from '../Icons';
import { signup as apiSignup } from '../../services/authService';
import { AuthContext } from '../../contexts/AuthContext';
import { Logo } from '../Logo';

interface SignupPageProps {
  onNavigateToLogin: () => void;
  onSignupSuccess: (email: string) => void; // This can now be deprecated or repurposed
}

export default function SignupPage({ onNavigateToLogin, onSignupSuccess }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // The new apiSignup returns the full user object with token
      const user = await apiSignup(name, email, password);
      login(user); // Log the user in directly
      // onSignupSuccess is no longer needed to navigate to OTP page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsLoading(false); // Only set loading to false on error
    }
    // On success, the component will unmount as the user becomes authenticated.
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-xl mb-4">
                <Logo className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
            <p className="text-indigo-300">Join to start creating with AI</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
                <UserIcon className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                />
            </div>
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
                    placeholder="Password (min. 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                />
            </div>

            {error && <p className="text-red-400 text-sm text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
            
            <button type="submit" disabled={isLoading} className="w-full py-3 px-6 text-lg font-semibold rounded-lg transition-all duration-300 bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-gray-600">
              {isLoading ? 'Creating Account...' : 'Create Account & Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-8">
            Already have an account?{' '}
            <button onClick={onNavigateToLogin} className="font-semibold text-indigo-400 hover:text-indigo-300">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}