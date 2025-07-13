/* global chrome */

/**
 * JWT Authentication Service for Chrome Extension
 * Handles JWT token management and API communication
 */
class JWTAuthService {
  constructor() {
    this.baseURL = 'https://api.sabapplier.com'; // Production backend URL
    this.token = null;
    this.userData = null;
  }

  /**
   * Set the JWT token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Get the current JWT token
   * @returns {string|null} - Current JWT token
   */
  getToken() {
    return this.token;
  }

  /**
   * Set user data
   * @param {object} userData - User data object
   */
  setUserData(userData) {
    this.userData = userData;
  }

  /**
   * Get current user data
   * @returns {object|null} - Current user data
   */
  getUserData() {
    return this.userData;
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token to check
   * @returns {boolean} - True if token is expired
   */
  isTokenExpired(token = this.token) {
    if (!token) return true;
    
    try {
      // Handle fallback tokens (not JWT format)
      if (token.startsWith('google-temp-') || token.startsWith('manual-fix-') || !token.includes('.')) {
        console.log('⚠️ Non-JWT token detected, treating as valid for now:', token.substring(0, 20) + '...');
        return false; // Fallback tokens are considered valid
      }
      
      // Standard JWT token validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('⚠️ Invalid JWT format, treating as expired');
        return true;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      const isExpired = payload.exp < currentTime;
      
      if (isExpired) {
        console.log('❌ JWT token is expired');
      }
      
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Get user data from JWT token
   * @param {string} token - JWT token
   * @returns {object|null} - User data or null if invalid
   */
  getUserFromToken(token = this.token) {
    if (!token || this.isTokenExpired(token)) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.user_id,
        email: payload.email,
        name: payload.name || payload.user_name || payload.first_name,
        exp: payload.exp,
        iat: payload.iat,
      };
    } catch (error) {
      console.error('Error extracting user from token:', error);
      return null;
    }
  }

  /**
   * Make an authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<object>} - API response
   */
  async makeAuthenticatedRequest(endpoint, options = {}) {
    if (!this.token || this.isTokenExpired()) {
      throw new Error('No valid token available');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    };

    const response = await fetch(url, { ...options, ...defaultOptions });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token expired or invalid');
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Validate token with backend
   * @returns {Promise<object>} - Validation result
   */
  async validateToken() {
    try {
      const response = await this.makeAuthenticatedRequest('/api/auth/validate');
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Token validation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh JWT token
   * @returns {Promise<object>} - Refresh result
   */
  async refreshToken() {
    try {
      const response = await this.makeAuthenticatedRequest('/api/auth/refresh', {
        method: 'POST'
      });
      
      if (response.token) {
        this.setToken(response.token);
        return { success: true, token: response.token };
      }
      
      throw new Error('No token in refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    this.token = null;
    this.userData = null;
  }
}

// Create and export a singleton instance
const jwtAuthService = new JWTAuthService();
export default jwtAuthService;
