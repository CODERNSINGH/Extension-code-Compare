// Debug logging
console.log('Background script loaded');

// Check if running in Chrome
if (typeof chrome === 'undefined' || !chrome.runtime) {
  console.error('Not running in Chrome extension context');
}

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

// Handle messages from the React app
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
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
  
  // Learning functionality handlers
  if (message.action === "startFormMonitoring") {
    console.log('Starting form monitoring...');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          files: ['content-script.js']
        }).then(() => {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'startFormMonitoring'}, (response) => {
            console.log('Form monitoring started:', response);
            if (sendResponse) {
              sendResponse({success: true});
            }
          });
        }).catch(error => {
          console.error('Error injecting content script:', error);
          if (sendResponse) {
            sendResponse({success: false, error: error.message});
          }
        });
      } else {
        if (sendResponse) {
          sendResponse({success: false, error: 'No active tab found'});
        }
      }
    });
    return true; // Indicate async response
  }
  
  if (message.action === "stopFormMonitoring") {
    console.log('Stopping form monitoring...');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'stopFormMonitoring'}, (response) => {
          console.log('Form monitoring stopped:', response);
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
    return true; // Indicate async response
  }
  
  if (message.action === "getFormData") {
    console.log('Getting form data...');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getFormData'}, (response) => {
          console.log('Form data retrieved:', response);
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
    return true; // Indicate async response
  }
  
  if (message.action === "clearFormData") {
    console.log('Clearing form data...');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'clearFormData'}, (response) => {
          console.log('Form data cleared:', response);
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
    return true; // Indicate async response
  }

  // Handle saving learned data from content script
  if (message.action === 'saveLearnedData') {
    // Get user email from storage
    chrome.storage.local.get(['sabapplier_last_user'], (result) => {
      const user = result.sabapplier_last_user;
      if (!user || !user.email) {
        console.error('No user email found in storage. Cannot save learned data.');
        if (sendResponse) sendResponse({ success: false, error: 'No user email found' });
        return;
      }
      
      // First, compare form data with existing autofill data
      const apiUrl = 'http://127.0.0.1:8000/api/users/extension/compare-form-data/';
      const formDataArr = Object.entries(message.data).map(([selector, obj]) => {
        return { [selector]: obj.value, type: obj.type };
      });
      
      console.log('Comparing form data with existing autofill data...');
      
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user.email,
          form_data: formDataArr,
          url: message.url || ''
        })
      })
      .then(res => res.json())
      .then(comparisonResult => {
        console.log('Form data comparison result:', comparisonResult);
        
        // Only save data that is different from existing autofill data
        if (comparisonResult.different_data && comparisonResult.different_data.length > 0) {
          // Save only the different data
          const saveUrl = 'http://127.0.0.1:8000/api/users/extension/save-learned-data/';
          return fetch(saveUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_email: user.email,
              form_data: comparisonResult.different_data,
              url: message.url || ''
            })
          });
        } else {
          // No different data to save
          return Promise.resolve({ ok: true, json: () => ({ success: true, message: 'No new data to save' }) });
        }
      })
      .then(res => res.json())
      .then(data => {
        console.log('Learned data saved:', data);
        if (sendResponse) sendResponse({ success: true, data });
      })
      .catch(err => {
        console.error('Failed to save learned data:', err);
        if (sendResponse) sendResponse({ success: false, error: err.message });
      });
    });
    return true; // Indicate async response
  }

  // Handle popup mode setting
  if (message.action === 'setPopupMode') {
    console.log('Setting popup mode:', message.enabled);
    
    // Store popup mode in local storage for persistence
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ sabapplier_popup_mode: message.enabled }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error storing popup mode:', chrome.runtime.lastError);
        }
      });
    }
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'setPopupMode',
          enabled: message.enabled,
          userEmail: message.userEmail
        }, (response) => {
          console.log('Popup mode set:', response);
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
    return true; // Indicate async response
  }

  // Relay toast notification to extension UI
  if (message.action === 'showToast' && message.message) {
    chrome.runtime.sendMessage({ action: 'showToast', message: message.message });
    sendResponse && sendResponse({ success: true });
    return true;
  }
});

let capturedData = [];
let currentUserEmail = null;
let currentWebsite = '';
let adaptiveLearningData = []; // Store adaptive learning data
let originalAutofilledData = []; // Store original autofilled data
let unfilledData = []; // Store unfilled data from autofill

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background script received message:', message);
    
    switch (message.action) {
        case 'formDataCaptured':
            handleFormDataCaptured(message.data, message.url, message.title);
            sendResponse({ success: true });
            break;
            
        case 'adaptiveLearningData':
            handleAdaptiveLearningData(message.data, message.url, message.title);
            sendResponse({ success: true });
            break;
            
        case 'getCapturedData':
            sendResponse({ 
                success: true, 
                data: capturedData,
                website: currentWebsite,
                originalData: originalAutofilledData
            });
            break;
            
        case 'getAdaptiveLearningData':
            sendResponse({ 
                success: true, 
                data: adaptiveLearningData,
                website: currentWebsite
            });
            break;
            
        case 'getAutofilledData':
            sendResponse({ 
                success: true, 
                data: originalAutofilledData,
                website: currentWebsite
            });
            break;
            
        case 'getUnfilledData':
            sendResponse({ 
                success: true, 
                data: unfilledData,
                website: currentWebsite
            });
            break;
            
        case 'clearCapturedData':
            capturedData = [];
            currentWebsite = '';
            sendResponse({ success: true });
            break;
            
        case 'clearAllData':
            capturedData = [];
            originalAutofilledData = [];
            unfilledData = [];
            currentWebsite = '';
            chrome.storage.local.remove(['originalAutofilledData', 'unfilledData', 'currentWebsite']);
            sendResponse({ success: true });
            break;
            
        case 'clearAdaptiveLearningData':
            adaptiveLearningData = [];
            sendResponse({ success: true });
            break;
            
        case 'saveSelectedData':
            handleSaveSelectedData(message.data);
            sendResponse({ success: true });
            break;
            
        case 'setPopupMode':
            // Legacy support - no longer used
            sendResponse({ success: true });
            break;
            
        case 'setUserEmail':
            currentUserEmail = message.email;
            sendResponse({ success: true });
            break;
            
        case 'getFormData':
            handleGetFormData(message, sender, sendResponse);
            break;
            
        case 'autoFillForm':
            // Store the original autofilled data
            if (message.data && Array.isArray(message.data)) {
                originalAutofilledData = message.data;
            }
            // Optionally, you can also trigger autofill logic here if needed
            sendResponse({ success: true });
            break;
            
        case 'storeAutofilledData':
            // Store autofilled data for change detection
            if (message.data && Array.isArray(message.data)) {
                originalAutofilledData = message.data;
                currentWebsite = {
                    url: message.url || '',
                    title: message.title || '',
                    timestamp: Date.now()
                };
                // Store in chrome.storage.local for persistence
                chrome.storage.local.set({ 
                    originalAutofilledData: message.data,
                    currentWebsite: currentWebsite
                });
            }
            sendResponse({ success: true });
            break;
            
        case 'storeUnfilledData':
            // Store unfilled data for DataPreview
            if (message.data && Array.isArray(message.data)) {
                unfilledData = message.data;
                currentWebsite = {
                    url: message.url || '',
                    title: message.title || '',
                    timestamp: Date.now()
                };
                // Store in chrome.storage.local for persistence
                chrome.storage.local.set({ 
                    unfilledData: message.data,
                    currentWebsite: currentWebsite
                });
            }
            sendResponse({ success: true });
            break;
            
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async response
});

// Handle captured form data
function handleFormDataCaptured(data, url, title) {
    console.log('Storing captured form data:', data);
    
    // Update current website info
    currentWebsite = {
        url: url,
        title: title,
        timestamp: Date.now()
    };
    
    // Store the captured data
    capturedData = data;
    
    // Notify extension that new data is available
    notifyExtensionOfNewData();
}

// Handle adaptive learning data
function handleAdaptiveLearningData(data, url, title) {
    console.log('Storing adaptive learning data:', data);
    // Update current website info
    currentWebsite = {
        url: url,
        title: title,
        timestamp: Date.now()
    };
    // Store the adaptive learning data
    if (Array.isArray(data)) {
        adaptiveLearningData = [...data]; // REPLACE, do not append
    } else {
        adaptiveLearningData = [data];
    }
    // Store in chrome.storage.local for React UI to pick up
    chrome.storage.local.set({ adaptiveLearningData, currentWebsite });
    // No Chrome notification
    // Notify extension that new adaptive learning data is available
    notifyExtensionOfAdaptiveLearningData();
}

// Notify extension of new adaptive learning data
function notifyExtensionOfAdaptiveLearningData() {
    console.log('New adaptive learning data available, extension can fetch it');
}

// Handle saving selected data
function handleSaveSelectedData(selectedData) {
    console.log('Saving selected data:', selectedData);
    
    // Here you would typically send this data to your backend
    // For now, we'll just clear the captured data
    capturedData = [];
    currentWebsite = '';
    
    // You could also store it in chrome.storage for persistence
    chrome.storage.local.set({
        savedFormData: selectedData,
        savedAt: Date.now()
    });
}

// Notify extension of new data (if extension is open)
function notifyExtensionOfNewData() {
    // This would be used if you want to notify the extension UI
    // that new data has been captured
    console.log('New form data captured, extension can fetch it');
}

// Handle getting form data from content script
function handleGetFormData(message, sender, sendResponse) {
    try {
        // Send message to content script to get form data
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getFormData' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error getting form data:', chrome.runtime.lastError);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse(response);
                    }
                });
            } else {
                sendResponse({ success: false, error: 'No active tab found' });
            }
        });
    } catch (error) {
        console.error('Error handling get form data:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('SabApplier AI extension installed:', details.reason);
    
    if (details.reason === 'install') {
        // Set up initial state
        capturedData = [];
        currentUserEmail = null;
        currentWebsite = '';
        
        console.log('SabApplier AI: Extension initialized');
    }
});

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && 
        (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        
        // Inject content script
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content-script.js']
        }).then(() => {
            console.log('Content script injected into tab:', tab.url);
        }).catch((error) => {
            console.error('Error injecting content script:', error);
        });
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('SabApplier AI: Extension started');
    
    // Initialize state
    capturedData = [];
    currentUserEmail = null;
    currentWebsite = '';
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        capturedData,
        currentUserEmail,
        currentWebsite,
        handleFormDataCaptured,
        handleSaveSelectedData
    };
}
