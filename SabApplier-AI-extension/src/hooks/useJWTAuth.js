/* global chrome */
import { useState, useEffect, useCallback } from 'react';

// Custom hook for JWT authentication in the extension
export const useJWTAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load authentication status from background script
  const loadAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if chrome runtime is available
      if (!chrome?.runtime?.sendMessage) {
        throw new Error('Chrome runtime not available');
      }
      
      const response = await chrome.runtime.sendMessage({
        action: 'GET_AUTH_STATUS'
      });
      
      if (response && !response.error) {
        setIsAuthenticated(response.isAuthenticated);
        setUserData(response.userData);
        setToken(response.token);
      } else {
        setIsAuthenticated(false);
        setUserData(null);
        setToken(null);
        if (response?.error) {
          setError(response.error);
        }
      }
    } catch (error) {
      console.error('Error loading auth status:', error);
      setError(error.message);
      setIsAuthenticated(false);
      setUserData(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for authentication changes
  useEffect(() => {
    // Initial load
    loadAuthStatus();

    // Listen for auth state changes
    const handleAuthStateChange = (message) => {
      if (message.action === 'AUTH_STATE_CHANGED') {
        console.log('Auth state changed:', message.type);
        
        setIsAuthenticated(message.isAuthenticated);
        setUserData(message.userData);
        
        if (message.type === 'logout') {
          setToken(null);
        } else if (message.type === 'login') {
          // Refresh to get the latest token
          loadAuthStatus();
        }
      }
    };

    // Add message listener only if chrome runtime is available
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleAuthStateChange);
    }

    // Cleanup listener
    return () => {
      if (chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleAuthStateChange);
      }
    };
  }, [loadAuthStatus]);

  // Refresh authentication status
  const refreshAuth = useCallback(() => {
    loadAuthStatus();
  }, [loadAuthStatus]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Clear extension storage
      if (chrome?.storage?.local) {
        await chrome.storage.local.remove(['jwt_token', 'user_data', 'auth_timestamp']);
      }
      
      // Update local state
      setIsAuthenticated(false);
      setUserData(null);
      setToken(null);
      
      // Notify background script
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'JWT_TOKEN_CLEARED',
          timestamp: Date.now()
        }).catch(error => {
          console.log('Background script notification failed (this is normal if extension is reloading)');
        });
      }
        
    } catch (error) {
      console.error('Error during logout:', error);
      setError(error.message);
    }
  }, []);

  // Make authenticated API request
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    if (!isAuthenticated || !token) {
      throw new Error('Not authenticated');
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    const response = await fetch(url, { ...options, ...defaultOptions });

    // If unauthorized, refresh auth status
    if (response.status === 401) {
      await refreshAuth();
      throw new Error('Token expired or invalid');
    }

    return response;
  }, [isAuthenticated, token, refreshAuth]);

  return {
    isAuthenticated,
    userData,
    token,
    loading,
    error,
    refreshAuth,
    logout,
    makeAuthenticatedRequest
  };
};

export default useJWTAuth;