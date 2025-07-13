/**
 * Debug helper for Chrome Extension
 * This script can be injected into the extension console to debug issues
 */

(function() {
  console.log('🛠️ SabApplier Debug Tool Loaded');
  
  // Check saved users in storage
  function checkSavedUsers() {
    if (!chrome?.storage?.local) {
      console.error('Chrome storage not available');
      return;
    }
    
    chrome.storage.local.get(['sabapplier_users', 'sabapplier_last_user', 'jwt_token'], (result) => {
      console.log('Storage contents:', result);
      
      if (result.sabapplier_users) {
        console.log('Saved users count:', Object.keys(result.sabapplier_users).length);
        console.table(result.sabapplier_users);
      } else {
        console.warn('No saved users found');
      }
      
      if (result.sabapplier_last_user) {
        console.log('Last user:', result.sabapplier_last_user);
      } else {
        console.warn('No last user found');
      }
      
      if (result.jwt_token) {
        console.log('JWT token exists:', !!result.jwt_token);
      } else {
        console.warn('No JWT token found');
      }
    });
  }
  
  // Add mock users for testing
  function addMockUsers() {
    if (!chrome?.storage?.local) {
      console.error('Chrome storage not available');
      return;
    }
    
    chrome.storage.local.get(['sabapplier_users'], (result) => {
      const existingUsers = result.sabapplier_users || {};
      
      const mockUsers = {
        ...existingUsers,
        'test@example.com': { name: 'Test User' },
        'demo@example.com': { name: 'Demo User' },
        'sample@example.com': { name: 'Sample User' }
      };
      
      chrome.storage.local.set({
        sabapplier_users: mockUsers
      }, () => {
        console.log('Mock users added successfully');
        checkSavedUsers();
      });
    });
  }
  
  // Clear all storage
  function clearAllStorage() {
    if (!chrome?.storage?.local) {
      console.error('Chrome storage not available');
      return;
    }
    
    chrome.storage.local.clear(() => {
      console.log('All storage cleared');
    });
  }
  
  // Export debug functions
  window.sabDebug = {
    checkSavedUsers,
    addMockUsers,
    clearAllStorage
  };
  
  console.log('Available debug commands:');
  console.log('- sabDebug.checkSavedUsers()');
  console.log('- sabDebug.addMockUsers()');
  console.log('- sabDebug.clearAllStorage()');
})();
