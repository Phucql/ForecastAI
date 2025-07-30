import React, { useState } from 'react';
import { X } from 'lucide-react';
import LandingPage from './LandingPage';
import LoginForm from './LoginForm';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, username: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export default function LoginPage({ onLogin, onSignup, isLoading = false, error }: LoginPageProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleGetStarted = () => {
    setShowLoginModal(true);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  const handleLogin = async (email: string, password: string) => {
    await onLogin(email, password);
  };

  const handleSignup = async (email: string, password: string, username: string) => {
    await onSignup(email, password, username);
  };

  return (
    <>
      <LandingPage onGetStarted={handleGetStarted} />
      
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <LoginForm 
                onLogin={handleLogin}
                onSignup={handleSignup}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 