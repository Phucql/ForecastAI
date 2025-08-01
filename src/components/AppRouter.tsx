import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import LoginPage from './LoginPage';
import ProtectedRoute from './ProtectedRoute';
import App from '../App';
import DemoPopup from './DemoPopup';
import ContactForm from './ContactForm';

export default function AppRouter() {
  const { user, login, signup, isLoading, showDemoPopup, setShowDemoPopup } = useAuth();
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      const result = await login(email, password);
      if (!result.success) {
        setLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('An unexpected error occurred');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignup = async (email: string, password: string, username: string) => {
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      const result = await signup(email, password, username);
      if (!result.success) {
        setLoginError(result.error || 'Signup failed');
      }
    } catch (error) {
      setLoginError('An unexpected error occurred');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle contact form event
  useEffect(() => {
    const handleOpenContactForm = () => {
      setShowContactForm(true);
    };

    window.addEventListener('openContactForm', handleOpenContactForm);
    return () => {
      window.removeEventListener('openContactForm', handleOpenContactForm);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage 
                onLogin={handleLogin}
                onSignup={handleSignup}
                isLoading={isLoggingIn}
                error={loginError}
              />
            )
          } 
        />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          } 
        />
      </Routes>
      
      {/* Demo Popup */}
      <DemoPopup 
        isOpen={showDemoPopup} 
        onClose={() => setShowDemoPopup(false)} 
      />
      
      {/* Contact Form */}
      <ContactForm 
        isOpen={showContactForm} 
        onClose={() => setShowContactForm(false)} 
      />
    </Router>
  );
} 