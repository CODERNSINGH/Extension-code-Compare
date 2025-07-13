// Debug logging
console.log('Background script loaded');

// Check if running in Chrome
if (typeof chrome === 'undefined' || !chrome.runtime) {
  console.error('Not running in Chrome extension context');
}

// JWT Authentication Service for Background Script
class BackgroundJWTAuth {
  constructor() {
    this.token = null;
    this.userData = null;
    this.isAuthenticated = false;
    this.latestAuthState = null;
    this.lastLogoutTimestamp = null;
    this.lastTokenCheck = 0;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
    this.init();
  }

  async init() {
    await this.loadTokenFromStorage();
  }

  async loadTokenFromStorage() {
    try {
      const result = await chrome.storage.local.get(['jwt_token', 'user_data', 'auth_timestamp']);
      
      if (result.jwt_token) {
        this.token = result.jwt_token;
        this.userData = result.user_data;
        this.isAuthenticated = true;
        console.log('JWT token loaded in background script');
      }
    } catch (error) {
      console.error('Error loading token from storage:', error);
    }
  }

  async saveTokenToStorage(token, userData = null) {
    try {
      await chrome.storage.local.set({
        jwt_token: token,
        user_data: userData,
        auth_timestamp: Date.now()
      });
      
      this.token = token;
      this.userData = userData;
      this.isAuthenticated = true;
      this.consecutiveFailures = 0; // Reset failure counter on successful login
      
      console.log('JWT token saved to storage from background');
      return true;
    } catch (error) {
      console.error('Error saving token to storage:', error);
      return false;
    }
  }

  async clearToken() {
    try {
      await chrome.storage.local.remove(['jwt_token', 'user_data', 'auth_timestamp']);
      
      this.token = null;
      this.userData = null;
      this.isAuthenticated = false;
      
      console.log('JWT token cleared from storage');
      return true;
    } catch (error) {
      console.error('Error clearing token from storage:', error);
      return false;
    }
  }

  decodeJWT(token) {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  isTokenExpired(token = this.token) {
    if (!token) return true;

    const decoded = this.decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }

  async handleTokenFromWebsite(token, userData = null) {
    if (!token) {
      console.error('No token provided');
      return false;
    }

    if (!token.includes('.')) {
      console.error('Invalid JWT token format');
      return false;
    }

    if (this.isTokenExpired(token)) {
      console.error('Received expired token');
      return false;
    }

    // Prevent rapid token updates (debounce)
    const now = Date.now();
    if (now - this.lastTokenCheck < 2000) { // 2 second debounce
      console.log('🔄 Token update too frequent, skipping...');
      return false;
    }
    this.lastTokenCheck = now;

    const saved = await this.saveTokenToStorage(token, userData);
    
    if (saved) {
      console.log('JWT token synchronized from website');
      this.notifyAuthenticationChange('login');
      return true;
    }
    
    return false;
  }

  async handleLogoutFromWebsite() {
    // Prevent duplicate logout processing
    const now = Date.now();
    if (this.lastLogoutTimestamp && (now - this.lastLogoutTimestamp) < 10000) { // Increased to 10 seconds
      console.log('🔄 Logout already processed recently, skipping...');
      return;
    }
    
    this.lastLogoutTimestamp = now;
    await this.clearToken();
    console.log('JWT token cleared due to website logout');
    this.notifyAuthenticationChange('logout');
  }

  notifyAuthenticationChange(type) {
    const message = {
      action: 'AUTH_STATE_CHANGED',
      type: type,
      isAuthenticated: this.isAuthenticated,
      userData: this.userData
    };

    // Try to send message to extension popup/side panel
    chrome.runtime.sendMessage(message).catch(error => {
      // This is expected when no receiver is active (popup/side panel closed)
      console.log('No active receiver for auth change notification (this is normal)');
    });

    // Store the latest auth state for when UI components request it
    this.latestAuthState = message;
  }
}

// Initialize JWT Auth service
const jwtAuth = new BackgroundJWTAuth();

// Configuration for token synchronization
let syncConfig = {
  autoSync: true, // Can be disabled by user
  pollingInterval: 10000, // 10 seconds
  debounceTime: 2000, // 2 seconds
  maxFailures: 3
};

// Load sync configuration from storage
chrome.storage.local.get(['sabapplier_sync_config'], (result) => {
  if (result.sabapplier_sync_config) {
    syncConfig = { ...syncConfig, ...result.sabapplier_sync_config };
    console.log('Loaded sync configuration:', syncConfig);
  }
});

// Reduced frequency token polling (every 10 seconds instead of 3)
setInterval(async () => {
  // Skip if auto-sync is disabled
  if (!syncConfig.autoSync) {
    return;
  }

  try {
    // Skip if too many consecutive failures
    if (jwtAuth.consecutiveFailures >= syncConfig.maxFailures) {
      console.log('🔄 Too many consecutive failures, skipping token check...');
      return;
    }

    // Get all tabs with the website
    const tabs = await chrome.tabs.query({
      url: [
        'https://sabapplier.com/*',
        'https://*.sabapplier.com/*'
      ]
    });
    
    if (tabs.length === 0) {
      return; // No relevant tabs open
    }

    // Check for JWT token in the active website tab
    for (const tab of tabs) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            return {
              jwt_token: localStorage.getItem('jwt_token'),
              sabapplier_extension_jwt: localStorage.getItem('sabapplier_extension_jwt'),
              sabapplier_user_data: localStorage.getItem('sabapplier_user_data'),
              sabapplier_extension_user: localStorage.getItem('sabapplier_extension_user'),
              sync_timestamp: localStorage.getItem('sabapplier_extension_sync_timestamp'),
              // Check for logout flags
              logout_flag: localStorage.getItem('sabapplier_extension_logout'),
              logout_timestamp: localStorage.getItem('sabapplier_extension_logout_timestamp'),
              // Check if main auth keys are missing (indicating logout)
              token_missing: !localStorage.getItem('token'),
              current_user_missing: !localStorage.getItem('currentUser'),
              is_authenticated: localStorage.getItem('isAuthenticated'),
              windowFlags: {
                sabApplierJWTToken: typeof window.sabApplierJWTToken !== 'undefined' ? 'present' : 'missing',
                sabApplierExtensionSync: typeof window.sabApplierExtensionSync !== 'undefined' ? window.sabApplierExtensionSync : null
              }
            };
          }
        });
        
        if (results && results[0] && results[0].result) {
          const data = results[0].result;
          const token = data.jwt_token || data.sabapplier_extension_jwt;
          const userData = data.sabapplier_user_data || data.sabapplier_extension_user;
          
          // More conservative logout detection
          const shouldLogout = data.logout_flag === 'true' && 
                              jwtAuth.isAuthenticated; // Only logout if we're currently authenticated
                              
          if (shouldLogout) {
            console.log('🔄 Logout detected in website, clearing extension auth...');
            console.log('🔄 Logout indicators:', {
              logout_flag: data.logout_flag,
              extension_authenticated: jwtAuth.isAuthenticated
            });
            
            await jwtAuth.handleLogoutFromWebsite();
            
            // Clear the logout flag to prevent repeated processing
            if (data.logout_flag === 'true') {
              try {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  function: () => {
                    localStorage.removeItem('sabapplier_extension_logout');
                    localStorage.removeItem('sabapplier_extension_logout_timestamp');
                    console.log('🔄 SabApplier Extension: Logout flags cleared');
                  }
                });
              } catch (error) {
                console.error('Error clearing logout flags:', error);
              }
            }
          }
          // Check for login/token update (only if we don't have a token or it's different)
          else if (token && (!jwtAuth.token || token !== jwtAuth.token)) {
            console.log('🔄 Found JWT token in website localStorage, syncing...');
            console.log('🔄 Token source:', data.jwt_token ? 'jwt_token' : 'sabapplier_extension_jwt');
            
            await jwtAuth.handleTokenFromWebsite(token, userData ? JSON.parse(userData) : null);
          }
          
          // Reset failure counter on successful check
          jwtAuth.consecutiveFailures = 0;
        }
      } catch (error) {
        // Increment failure counter
        jwtAuth.consecutiveFailures++;
        console.error('Error checking tab for JWT token:', error);
        
        // Ignore errors for tabs that don't have the right permissions
        if (!error.message.includes('Cannot access')) {
          console.error('Error checking tab for JWT token:', error);
        }
      }
    }
  } catch (error) {
    jwtAuth.consecutiveFailures++;
    console.error('Error in JWT polling:', error);
  }
}, syncConfig.pollingInterval); // Use configurable polling interval

// When extension is installed, set up side panel behavior
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  try {
    // Initialize storage
    chrome.storage.local.get(['sabapplier_users'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error initializing storage:', chrome.runtime.lastError);
        return;
      }
      // If no users exist, initialize with empty object
      if (!result.sabapplier_users) {
        chrome.storage.local.set({ sabapplier_users: {} }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error setting initial storage:', chrome.runtime.lastError);
          } else {
            console.log('Storage initialized successfully');
          }
        });
      }
    });

    // Set initial side panel behavior
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .then(() => {
        console.log('Side panel behavior set successfully');
        // Initialize side panel for all existing tabs
        return chrome.tabs.query({});
      })
      .then((tabs) => {
        const promises = tabs.map(tab => 
          chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: "index.html",
            enabled: true
          })
        );
        return Promise.all(promises);
      })
      .then(() => console.log('Side panel initialized for all tabs'))
      .catch(error => console.error('Error during installation:', error));
  } catch (error) {
    console.error('Error in onInstalled:', error);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
  try {
    chrome.sidePanel.open({ tabId: tab.id })
      .then(() => {
        console.log('Side panel opened for tab:', tab.id);
      })
      .catch(error => {
        console.error('Error opening side panel:', error);
      });
  } catch (error) {
    console.error('Error in action click handler:', error);
  }
});

// Enable side panel for each new tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Tab updated:', tabId, changeInfo.status);
  if (changeInfo.status === 'complete') {
    try {
      chrome.sidePanel.setOptions({
        tabId,
        path: "index.html",
        enabled: true,
      }).then(() => console.log('Side panel enabled for new tab:', tabId))
        .catch(error => console.error('Error enabling side panel for new tab:', error));
    } catch (error) {
      console.error('Error in onUpdated:', error);
    }
  }
});

// Handle messages from the React app and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  // Handle JWT token from website
  if (message.action === 'JWT_TOKEN_RECEIVED') {
    console.log('JWT token received from website:', message.source || 'unknown');
    
    jwtAuth.handleTokenFromWebsite(message.token, message.userData)
      .then(success => {
        if (sendResponse) {
          sendResponse({ success: success });
        }
      })
      .catch(error => {
        console.error('Error handling JWT token:', error);
        if (sendResponse) {
          sendResponse({ success: false, error: error.message });
        }
      });
    
    return true; // Async response
  }
  
  // Handle JWT logout from website
  if (message.action === 'JWT_TOKEN_CLEARED') {
    console.log('JWT token cleared message received from website');
    
    // Only process if we're actually authenticated
    if (!jwtAuth.isAuthenticated) {
      console.log('Extension already logged out, skipping token clear');
      if (sendResponse) {
        sendResponse({ success: true });
      }
      return true;
    }
    
    jwtAuth.handleLogoutFromWebsite()
      .then(() => {
        if (sendResponse) {
          sendResponse({ success: true });
        }
      })
      .catch(error => {
        console.error('Error handling JWT logout:', error);
        if (sendResponse) {
          sendResponse({ success: false, error: error.message });
        }
      });
    
    return true; // Async response
  }
  
  // Handle extension requesting auth status
  if (message.action === 'GET_AUTH_STATUS') {
    console.log('Extension requesting auth status');
    
    jwtAuth.loadTokenFromStorage()
      .then(() => {
        if (sendResponse) {
          sendResponse({
            isAuthenticated: jwtAuth.isAuthenticated && !jwtAuth.isTokenExpired(),
            userData: jwtAuth.userData,
            token: jwtAuth.token
          });
        }
      })
      .catch(error => {
        console.error('Error getting auth status:', error);
        if (sendResponse) {
          sendResponse({ isAuthenticated: false, error: error.message });
        }
      });
    
    return true; // Async response
  }

  // Handle sync configuration updates
  if (message.action === 'UPDATE_SYNC_CONFIG') {
    console.log('Updating sync configuration:', message.config);
    
    syncConfig = { ...syncConfig, ...message.config };
    
    // Save to storage
    chrome.storage.local.set({ sabapplier_sync_config: syncConfig }, () => {
      if (sendResponse) {
        sendResponse({ success: true, config: syncConfig });
      }
    });
    
    return true; // Async response
  }

  // Handle sync configuration requests
  if (message.action === 'GET_SYNC_CONFIG') {
    console.log('Extension requesting sync configuration');
    
    if (sendResponse) {
      sendResponse({ success: true, config: syncConfig });
    }
    
    return true;
  }
  
  if (message.action === "close_panel") {
    console.log('Attempting to close side panel');
    try {
      // Get the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const currentTab = tabs[0];
          
          // Disable the side panel for the current tab
          chrome.sidePanel.setOptions({
            tabId: currentTab.id,
            enabled: false
          }).then(() => {
            console.log('Side panel disabled');
            if (sendResponse) {
              sendResponse({ success: true });
            }
          }).catch(error => {
            console.error('Error closing side panel:', error);
            if (sendResponse) {
              sendResponse({ success: false, error: error.message });
            }
          });
        } else {
          console.error('No active tab found');
          if (sendResponse) {
            sendResponse({ success: false, error: 'No active tab found' });
          }
        }
      });
      // Return true to indicate we will send a response asynchronously
      return true;
    } catch (error) {
      console.error('Error in close_panel handler:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
    }
  }
  
  // Keep existing functionality handlers
  if (message.action === "startFormMonitoring") {
    console.log('Starting form monitoring...');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'startFormMonitoring'}, (response) => {
          console.log('Form monitoring started:', response);
          if (sendResponse) {
            sendResponse({success: true});
          }
        });
      } else {
        if (sendResponse) {
          sendResponse({success: false, error: 'No active tab found'});
        }
      }
    });
    return true;
  }
  
  if (message.action === "getFormData") {
    console.log('Getting form data...');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getFormData'}, (response) => {
          if (sendResponse) {
            sendResponse(response);
          }
        });
      } else {
        if (sendResponse) {
          sendResponse({success: false, error: 'No active tab found'});
        }
      }
    });
    return true;
  }
  
  if (message.action === "autoFillForm") {
    console.log('Auto-filling form...');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'autoFillForm', data: message.data}, (response) => {
          if (sendResponse) {
            sendResponse(response);
          }
        });
      } else {
        if (sendResponse) {
          sendResponse({success: false, error: 'No active tab found'});
        }
      }
    });
    return true;
  }
  
  if (message.action === "getAdaptiveLearningData") {
    console.log('Getting adaptive learning data...');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getAdaptiveLearningData'}, (response) => {
          if (sendResponse) {
            sendResponse(response);
          }
        });
      } else {
        if (sendResponse) {
          sendResponse({success: false, error: 'No active tab found'});
        }
      }
    });
    return true;
  }
  
  if (message.action === "clearAdaptiveLearningData") {
    console.log('Clearing adaptive learning data...');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'clearAdaptiveLearningData'}, (response) => {
          if (sendResponse) {
            sendResponse(response);
          }
        });
      } else {
        if (sendResponse) {
          sendResponse({success: false, error: 'No active tab found'});
        }
      }
    });
    return true;
  }
  
  if (message.action === "openDataPreview") {
    console.log('Opening data preview...');
    if (sendResponse) {
      sendResponse({success: true});
    }
    return true;
  }

  // Data capture and preview functionality
  if (message.action === "getCapturedData") {
    console.log('Getting captured data...');
    // Get captured form data from storage or return empty array
    chrome.storage.local.get(['capturedFormData', 'capturedWebsite', 'originalAutofillData'], (result) => {
      if (sendResponse) {
        sendResponse({
          success: true,
          data: result.capturedFormData || [],
          website: result.capturedWebsite || null,
          originalData: result.originalAutofillData || []
        });
      }
    });
    return true;
  }

  if (message.action === "saveCapturedData") {
    console.log('Saving captured data...');
    const { data, website, originalData } = message;
    chrome.storage.local.set({
      capturedFormData: data,
      capturedWebsite: website,
      originalAutofillData: originalData
    }, () => {
      if (sendResponse) {
        sendResponse({success: true});
      }
    });
    return true;
  }

  if (message.action === "clearCapturedData") {
    console.log('Clearing captured data...');
    chrome.storage.local.remove(['capturedFormData', 'capturedWebsite', 'originalAutofillData'], () => {
      if (sendResponse) {
        sendResponse({success: true});
      }
    });
    return true;
  }

  if (message.action === "getAdaptiveLearningData") {
    console.log('Getting adaptive learning data...');
    // Get adaptive learning data from storage
    chrome.storage.local.get(['adaptiveLearningData'], (result) => {
      console.log('Retrieved adaptive learning data:', result.adaptiveLearningData);
      if (sendResponse) {
        sendResponse({
          success: true,
          data: result.adaptiveLearningData || []
        });
      }
    });
    return true;
  }

  if (message.action === "saveAdaptiveLearningData") {
    console.log('Saving adaptive learning data...', message.data);
    const { data } = message;
    chrome.storage.local.set({
      adaptiveLearningData: data
    }, () => {
      console.log('Adaptive learning data saved successfully');
      if (sendResponse) {
        sendResponse({success: true});
      }
    });
    return true;
  }
});
