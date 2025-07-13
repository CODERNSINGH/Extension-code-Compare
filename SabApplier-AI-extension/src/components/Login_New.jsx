import React, { useState } from 'react';

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
    <div className="login-container min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Enhanced Header Section */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-500/25 animate-pulse-slow">
            <span className="text-3xl text-white font-bold">SA</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Welcome to SabApplier AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Please login to your account to continue
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 p-8 border border-white/20 dark:border-gray-700/30">
          <div className="redirect-notice mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm flex items-center">
                <span className="mr-2">🔄</span>
                You'll be redirected to our website to login. 
                Once logged in, the extension will automatically sync your account.
              </p>
            </div>
          </div>

          <div className="auth-buttons space-y-4">
            <button 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
              onClick={handleLoginRedirect}
              disabled={isRedirecting}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-xl">🔐</span>
                <span className="text-lg">
                  {isRedirecting ? 'Redirecting...' : 'Login to Website'}
                </span>
              </div>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">or</span>
              </div>
            </div>

            <button 
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25"
              onClick={handleSignupRedirect}
              disabled={isRedirecting}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-xl">✨</span>
                <span className="text-lg">
                  {isRedirecting ? 'Redirecting...' : 'Create Account'}
                </span>
              </div>
            </button>
          </div>

          <div className="sync-info mt-8">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="mr-2">ℹ️</span>
                How it works:
              </h4>
              <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</span>
                  Click "Login to Website" or "Create Account"
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</span>
                  Complete authentication on our website
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</span>
                  Return to this extension - you'll be automatically logged in!
                </li>
              </ol>
            </div>
          </div>

          <div className="help-section mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Having trouble? Make sure you're logged in to{' '}
              <a 
                href={WEBSITE_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                {WEBSITE_URL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
