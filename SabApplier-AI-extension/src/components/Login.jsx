import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Footer from './Footer';

const WEBSITE_URL = 'https://sabapplier.com'; // Production URL

export default function Login({ onLogin }) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLoginRedirect = () => {
    setIsRedirecting(true);
    // Open your website's login page in a new tab
    chrome.tabs.create({ 
      url: `${WEBSITE_URL}/login`,
      active: true 
    });
    
    // Show a message and close the extension popup after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  };

  const handleSignupRedirect = () => {
    setIsRedirecting(true);
    // Open your website's signup page in a new tab
    chrome.tabs.create({ 
      url: `${WEBSITE_URL}/signup`,
      active: true 
    });
    
    // Show a message and close the extension popup after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Header with Logo */}
          <div className="text-center mb-8 animate-fadeIn">
            <img 
              src="/logo.jpeg" 
              alt="SabApplier AI Logo" 
              className="w-24 h-24 mx-auto mb-4 rounded-xl object-cover"
            />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to SabApplier AI
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              Sign in to continue to your account
            </p>
          </div>

          {/* Simple Button Container */}
          <div className="space-y-4">
            {/* Login Button */}
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              onClick={handleLoginRedirect}
              disabled={isRedirecting}
              data-testid="login-button"
            >
              <span>
                {isRedirecting ? 'Redirecting...' : 'Login'}
              </span>
              {!isRedirecting && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>

            {/* Signup Button */}
            <button 
              className="w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              onClick={handleSignupRedirect}
              disabled={isRedirecting}
              data-testid="signup-button"
            >
              <span>
                {isRedirecting ? 'Redirecting...' : 'Create Account'}
              </span>
              {!isRedirecting && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
