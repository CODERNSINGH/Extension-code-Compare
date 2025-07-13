import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import YourDetails from './components/YourDetails';
import FilledDetails from './components/FilledDetails';
import DataPreview from './components/DataPreview';
import Header from './components/Header';
import Loader from './components/Loader';
import AdaptiveLearningPopup from './components/AdaptiveLearningPopup';
import ToastNotification from './components/ToastNotification';

import { getAuthToken } from './services/API/getAuthToken';
import LoginFunction from './services/API/LoginFunction';

function AppInner() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastRef = React.useRef(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for background message to open DataPreview
  useEffect(() => {
    if (!chrome?.runtime?.onMessage) return;
    const handler = (message, sender, sendResponse) => {
      if (message.action === 'openDataPreview') {
        navigate('/data-preview');
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [navigate]);

  // Listen for showToast messages from background
  useEffect(() => {
    if (!chrome?.runtime?.onMessage) return;
    const handler = (message, sender, sendResponse) => {
      if (message.action === 'showToast' && message.message) {
        setToastMessage(message.message);
        setShowToast(true);
        toastRef.current = true;
      }
      // Existing openDataPreview handler
      if (message.action === 'openDataPreview') {
        navigate('/data-preview');
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [navigate]);

  // Poll for adaptive learning data and show toast if detected
  useEffect(() => {
    let interval;
    if (user) {
      interval = setInterval(async () => {
        if (window.chrome && chrome.runtime) {
          const response = await chrome.runtime.sendMessage({ action: 'getAdaptiveLearningData' });
          if (response && response.success && response.data && response.data.length > 0) {
            if (!toastRef.current) {
              setToastMessage('Changes detected! Click to review.');
              setShowToast(true);
              toastRef.current = true;
            }
          } else {
            setShowToast(false);
            toastRef.current = false;
          }
        }
      }, 2000);
    }
    return () => interval && clearInterval(interval);
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sabapplier_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await getAuthToken(token);
      
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        localStorage.removeItem('sabapplier_token');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('sabapplier_token');
      setError('Authentication failed. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      const result = await LoginFunction(email, password, (msg) => console.log(msg));
      
      if (result && result.success) {
        const userData = {
          email: result.user_email || email,
          name: result.user_name || result.name || email.split('@')[0]
        };
        
        // Store token if available
        if (result.token) {
          localStorage.setItem('sabapplier_token', result.token);
        }
        
        setUser(userData);
        setError(null);
      } else {
        throw new Error(result?.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sabapplier_token');
  };

  const handleToastClick = () => {
    setShowToast(false);
    toastRef.current = false;
    navigate('/data-preview');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 flex items-center justify-center">
        <Loader message="Loading SabApplier AI..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
            <span className="text-red-600 dark:text-red-400 text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Authentication Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 flex items-center justify-center p-4">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950">
      <Header user={user} onLogout={handleLogout} />
      <main className="flex-1 pt-24 lg:pt-28 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto mt-12">
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
            <Route path="/your-details" element={<YourDetails user={user} />} />
            <Route path="/filled-details" element={<FilledDetails user={user} />} />
            <Route path="/data-preview" element={<DataPreview user={user} />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
      {/* Always mount the popup, it will show itself if there is data */}
      <AdaptiveLearningPopup user={user} onClose={() => {}} />
      <ToastNotification
        message={toastMessage}
        visible={showToast}
        onClick={handleToastClick}
        onClose={() => { setShowToast(false); toastRef.current = false; }}
      />
      {/* Global Footer */}
      <footer className="w-full bg-black text-white border-t border-gray-800 py-4 text-xs flex flex-col md:flex-row items-center justify-between px-4 md:px-12 mt-8">
        <div className="mb-2 md:mb-0">&copy; {new Date().getFullYear()} SabApplier AI. All rights reserved.</div>
        <div className="flex gap-4 items-center">
          <a href="https://sabapplier.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">Privacy Policy</a>
          <span>|</span>
          <a href="mailto:sabapplierai100m@gmail.com" className="underline hover:text-gray-300">Support</a>
        </div>
      </footer>
    </div>
  );
}

export default AppInner;
