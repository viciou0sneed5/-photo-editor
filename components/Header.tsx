
import React, { useContext } from 'react';
import { SparklesIcon, UserIcon, LogOutIcon } from './Icons';
import { AuthContext } from '../contexts/AuthContext';

export const Header: React.FC = () => {
  const { currentUser, logout } = useContext(AuthContext);

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Creative Suite</h1>
            <p className="text-sm text-indigo-300">Photo Editor & Video Generator powered by Gemini</p>
          </div>
        </div>
        {currentUser && (
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-gray-300">
                <UserIcon className="w-5 h-5" />
                <span className="font-semibold">{currentUser.name}</span>
             </div>
             <button 
                onClick={logout} 
                className="flex items-center gap-2 py-2 px-4 bg-gray-700 hover:bg-red-600/50 rounded-lg font-semibold text-gray-300 hover:text-red-300 transition-colors"
                aria-label="Logout"
            >
                <LogOutIcon className="w-5 h-5" />
                <span>Logout</span>
             </button>
          </div>
        )}
      </div>
    </header>
  );
};