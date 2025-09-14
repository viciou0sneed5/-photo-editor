import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { verifyOtp as apiVerifyOtp } from '../../services/authService';
import { Logo } from '../Logo';

interface OtpPageProps {
  userEmail: string | null;
  onNavigateToLogin: () => void;
}

export default function OtpPage({ userEmail, onNavigateToLogin }: OtpPageProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>("This page is for demonstration purposes. The new backend logs you in directly after signup.");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("This form is disabled. Please go back and sign up again to be logged in automatically.");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-xl mb-4">
                <Logo className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-white">Verification Bypassed</h1>
             <p className="text-indigo-300 mt-2">
                With the new backend, you are logged in automatically after signing up.
            </p>
            <p className="text-yellow-400 bg-yellow-900/50 p-2 mt-4 rounded-lg text-sm">
               There is no need to enter an OTP code.
            </p>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <input
                    type="text"
                    placeholder="_ _ _ _ _ _"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-3 text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50"
                    required
                    maxLength={6}
                    disabled={true}
                />
            </div>

            {error && <p className="text-red-400 text-sm text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
            
            <button type="submit" disabled={true} className="w-full py-3 px-6 text-lg font-semibold rounded-lg transition-all duration-300 bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-gray-600 disabled:cursor-not-allowed">
              Verify & Sign In
            </button>
          </form>

          <p className="text-center text-gray-400 mt-8">
            Please go back to sign up or sign in. {' '}
            <button onClick={onNavigateToLogin} className="font-semibold text-indigo-400 hover:text-indigo-300">
              Go Back
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}