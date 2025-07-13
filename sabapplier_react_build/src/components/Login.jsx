import React, { useState } from 'react';
import Loader from './Loader';
import AccountDropdown from './AccountDropdown';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [focusedField, setFocusedField] = useState('');
  
  const showLoader = loading;

  const onStatusUpdate = (msg, type) => {
    setStatusMessage(msg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('');

    try {
      if (onLogin) {
        await onLogin(email, password);
      }
    } catch (err) {
      console.error('Login error:', err);
      setStatusMessage('Login failed: ' + (err.message || 'Unknown error'));
    }
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  return (
    <div className={`login-container ${showLoader ? 'blurred' : ''}`}>
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
            Sign in to automate your form filling experience
          </p>
        </div>

        {/* Enhanced Login Form */}
        <form className="space-y-6 animate-slideIn" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                className={`input-modern pl-12 pr-4 ${
                  focusedField === 'email' 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10' 
                    : 'hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                className={`input-modern pl-12 pr-14 ${
                  focusedField === 'password' 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10' 
                    : 'hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Enhanced Submit Button */}
          <button 
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 overflow-hidden group relative" 
            type="submit" 
            disabled={loading}
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <span className="relative flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In to SabApplier
                </>
              )}
            </span>
          </button>
        </form>

        {/* Enhanced Status Message */}
        {statusMessage && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                {statusMessage}
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Footer Links */}
        <div className="mt-10 text-center space-y-6 animate-slideInRight">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <a 
              href="https://sabapplier.com/signup" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors hover:underline"
            >
              Sign up here
            </a>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
            By signing in, you agree to our{' '}
            <a 
              href="https://sabapplier.com/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Terms of Service
            </a>
            {' '}and{' '}
            <a 
              href="https://sabapplier.com/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
      
      {showLoader && <Loader message="Signing you in..." />}
    </div>
  );
}