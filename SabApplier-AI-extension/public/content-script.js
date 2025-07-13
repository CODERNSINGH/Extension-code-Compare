/* global chrome */

// Content script for JWT synchronization between website and extension
console.log('🔄 SabApplier Extension: Content script initializing...', {
  url: window.location.href,
  hostname: window.location.hostname,
  timestamp: new Date().toISOString(),
  chromeRuntime: typeof chrome !== 'undefined' && !!chrome.runtime,
  manifestVersion: typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.getManifest?.()?.manifest_version : 'N/A'
});

// Add error handling for uncaught errors
window.addEventListener('error', function(error) {
  if (error.filename && error.filename.includes('content-script.js')) {
    console.error('❌ SabApplier Extension: Content script error:', {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      stack: error.error?.stack
    });
  }
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
  console.error('❌ SabApplier Extension: Unhandled promise rejection:', event.reason);
});

// Set up extension detection markers for test pages
(function setupExtensionDetection() {
  try {
    console.log('🏗️ SabApplier Extension: Setting up detection markers...');
    
    // Mark the page as having the extension loaded
    document.documentElement.setAttribute('data-sabapplier-extension', 'active');
    
    // Add meta tag for detection
    const meta = document.createElement('meta');
    meta.name = 'sabapplier-extension';
    meta.content = 'loaded';
    document.head.appendChild(meta);
    
    // Add style marker for detection
    const style = document.createElement('style');
    style.setAttribute('data-sabapplier-extension', 'true');
    style.textContent = '/* SabApplier Extension Loaded */';
    document.head.appendChild(style);
    
    // Set up global extension object for detection
    window.sabapplierExtension = {
      version: '1.0',
      loaded: true,
      contentScriptActive: true,
      timestamp: Date.now(),
      chromeRuntime: typeof chrome !== 'undefined' && !!chrome.runtime
    };
    
    // Set up content script marker
    window.sabapplierContentScript = true;
    
    console.log('✅ SabApplier Extension: Detection markers set up successfully', {
      documentAttribute: document.documentElement.getAttribute('data-sabapplier-extension'),
      metaTag: !!document.querySelector('meta[name="sabapplier-extension"]'),
      styleTag: !!document.querySelector('style[data-sabapplier-extension]'),
      windowObject: !!window.sabapplierExtension
    });
  } catch (error) {
    console.error('❌ SabApplier Extension: Error setting up detection markers:', error);
  }
})();

// Listen for test messages and health checks
window.addEventListener('message', function(event) {
  // Handle test messages
  if (event.data?.type === 'SABAPPLIER_HEALTH_CHECK' || event.data?.type === 'SABAPPLIER_CONTENT_SCRIPT_TEST') {
    console.log('🧪 SabApplier Extension: Test message received:', event.data);
    
    // Respond to test
    window.postMessage({
      type: 'SABAPPLIER_CONTENT_SCRIPT_RESPONSE',
      source: 'sabapplier-extension',
      message: 'Content script is active and responding',
      originalTest: event.data.test,
      timestamp: Date.now()
    }, '*');
    
    return;
  }
  
  // Handle adaptive learning test trigger
  if (event.data?.type === 'SABAPPLIER_ADAPTIVE_LEARNING_TRIGGER') {
    console.log('🧠 SabApplier Extension: Adaptive learning triggered by test page:', event.data);
    
    // Process the adaptive learning data
    const changes = event.data.data?.changes || {};
    const changeCount = Object.keys(changes).length;
    
    if (changeCount > 0) {
      console.log(`📊 SabApplier Extension: Processing ${changeCount} form changes`);
      
      // Simulate popup trigger (in real extension, this would show the popup)
      setTimeout(() => {
        window.postMessage({
          type: 'SABAPPLIER_POPUP_SHOWN',
          source: 'sabapplier-extension',
          data: {
            changes: changes,
            changeCount: changeCount,
            timestamp: Date.now()
          }
        }, '*');
        
        // Also dispatch custom event
        document.dispatchEvent(new CustomEvent('sabapplierPopupShown', {
          detail: {
            changes: changes,
            changeCount: changeCount,
            source: 'extension'
          }
        }));
        
        console.log('🎉 SabApplier Extension: Adaptive learning popup shown!');
      }, 1000);
    }
    
    return;
  }
});

// Listen for custom events from test pages
document.addEventListener('sabapplierHealthCheck', function(event) {
  console.log('🧪 SabApplier Extension: Health check event received:', event.detail);
  
  // Dispatch response event
  document.dispatchEvent(new CustomEvent('sabapplierHealthCheckResponse', {
    detail: {
      status: 'active',
      contentScript: true,
      timestamp: Date.now()
    }
  }));
});

// Listen for adaptive learning events
document.addEventListener('sabapplierAdaptiveLearning', function(event) {
  console.log('🧠 SabApplier Extension: Adaptive learning event received:', event.detail);
  
  // Process the learning data
  const changes = event.detail.changes || {};
  const changeCount = Object.keys(changes).length;
  
  if (changeCount > 0) {
    console.log(`📊 SabApplier Extension: Processing ${changeCount} form changes from event`);
    
    // Trigger popup after short delay
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('sabapplierPopupShown', {
        detail: {
          changes: changes,
          changeCount: changeCount,
          source: 'extension-event'
        }
      }));
    }, 500);
  }
});

// Listen for JWT tokens from the website
window.addEventListener('message', function(event) {
  console.log('🔄 SabApplier Extension: Message received from website:', event.data);
  
  // Only accept messages from the same origin
  if (event.origin !== window.location.origin) {
    console.log('❌ SabApplier Extension: Rejected message from different origin:', event.origin);
    return;
  }

  // Check if the message is a JWT token from our website
  if (event.data && event.data.type === 'SABAPPLIER_JWT_TOKEN') {
    console.log('✅ SabApplier Extension: JWT token received from website');
    
    // Check if extension context is still valid
    if (!chrome?.runtime?.id) {
      console.log('🔄 SabApplier Extension: Extension context invalidated, skipping token sync');
      return;
    }
    
    // Send the token to the background script
    chrome.runtime.sendMessage({
      action: 'JWT_TOKEN_RECEIVED',
      token: event.data.token,
      userData: event.data.userData,
      timestamp: Date.now()
    }).then(response => {
      console.log('✅ SabApplier Extension: Token sent to background script, response:', response);
    }).catch(error => {
      if (error.message.includes('Extension context invalidated')) {
        console.log('🔄 SabApplier Extension: Extension context invalidated during token sync');
      } else {
        console.error('❌ SabApplier Extension: Error sending JWT token to background:', error);
      }
    });
  }
  
  // Check if the message is a logout from our website
  if (event.data && event.data.type === 'SABAPPLIER_LOGOUT') {
    console.log('✅ SabApplier Extension: Logout message received from website');
    
    // Send logout notification to the background script
    chrome.runtime.sendMessage({
      action: 'JWT_TOKEN_CLEARED',
      reason: 'website_logout',
      timestamp: Date.now()
    }).then(response => {
      console.log('✅ SabApplier Extension: Website logout sent to background script, response:', response);
    }).catch(error => {
      console.error('❌ SabApplier Extension: Error sending website logout to background:', error);
    });
  }
});

// Listen for custom events from the website
window.addEventListener('sabapplier_jwt_login', function(event) {
  console.log('🔄 SabApplier Extension: Custom JWT login event received:', event.detail);
  
  // Check if extension context is still valid
  if (!chrome?.runtime?.id) {
    console.log('🔄 SabApplier Extension: Extension context invalidated, skipping token sync');
    return;
  }
  
  // Send the token to the background script
  chrome.runtime.sendMessage({
    action: 'JWT_TOKEN_RECEIVED',
    token: event.detail.token,
    userData: event.detail.userData,
    timestamp: Date.now(),
    source: 'custom_event'
  }).then(response => {
    console.log('✅ SabApplier Extension: Custom event token sent to background script, response:', response);
  }).catch(error => {
    if (error.message.includes('Extension context invalidated')) {
      console.log('🔄 SabApplier Extension: Extension context invalidated during token sync');
    } else {
      console.error('❌ SabApplier Extension: Error sending custom event JWT token to background:', error);
    }
  });
});

// Listen for logout events
window.addEventListener('sabapplier_jwt_logout', function(event) {
  console.log('🔄 SabApplier Extension: JWT logout event received');
  
  // Check if extension context is still valid
  if (!chrome?.runtime?.id) {
    console.log('🔄 SabApplier Extension: Extension context invalidated, skipping logout sync');
    return;
  }
  
  // Send the logout event to the background script
  chrome.runtime.sendMessage({
    action: 'JWT_TOKEN_CLEARED',
    timestamp: Date.now(),
    source: 'logout_event'
  }).then(response => {
    console.log('✅ SabApplier Extension: Logout event sent to background script, response:', response);
  }).catch(error => {
    if (error.message.includes('Extension context invalidated')) {
      console.log('🔄 SabApplier Extension: Extension context invalidated during logout sync');
    } else {
      console.error('❌ SabApplier Extension: Error sending logout event to background:', error);
    }
  });
});

// Listen for extension-specific logout events
window.addEventListener('sabapplier_extension_logout', function(event) {
  console.log('🔄 SabApplier Extension: Extension-specific logout event received');
  
  chrome.runtime.sendMessage({
    action: 'JWT_TOKEN_CLEARED',
    reason: 'extension_logout_event',
    timestamp: Date.now()
  }).then(response => {
    console.log('✅ SabApplier Extension: Extension logout sent to background script, response:', response);
  }).catch(error => {
    console.error('❌ SabApplier Extension: Error sending extension logout to background:', error);
  });
});

// Check for existing JWT tokens in localStorage/sessionStorage
function checkExistingTokens() {
  const localJWT = localStorage.getItem('sabapplier_jwt_token') || localStorage.getItem('jwt_token');
  const sessionJWT = sessionStorage.getItem('sabapplier_jwt_token') || sessionStorage.getItem('jwt_token');
  
  // Check for user data as well
  const userData = localStorage.getItem('sabapplier_user_data') || localStorage.getItem('user_data');
  
  if (localJWT || sessionJWT) {
    console.log('SabApplier Extension: Found existing JWT token');
    
    // Send the token to the background script
    chrome.runtime.sendMessage({
      action: 'JWT_TOKEN_RECEIVED',
      token: localJWT || sessionJWT,
      userData: userData ? JSON.parse(userData) : null,
      timestamp: Date.now(),
      source: 'existing'
    }).catch(error => {
      console.error('Error sending existing JWT token to background:', error);
    });
  }
}

// Check for existing tokens when the content script loads (with delay)
setTimeout(checkExistingTokens, 2000); // Increased delay to 2 seconds

// Debounce function for token updates
let tokenUpdateTimeout = null;
function debouncedTokenUpdate(key, value, source) {
  if (tokenUpdateTimeout) {
    clearTimeout(tokenUpdateTimeout);
  }
  
  tokenUpdateTimeout = setTimeout(() => {
    console.log(`SabApplier Extension: JWT token updated in ${source}`);
    
    // Get user data if available
    const userData = localStorage.getItem('sabapplier_user_data') || localStorage.getItem('user_data');
    
    chrome.runtime.sendMessage({
      action: 'JWT_TOKEN_RECEIVED',
      token: value,
      userData: userData ? JSON.parse(userData) : null,
      timestamp: Date.now(),
      source: source
    }).catch(error => {
      console.error(`Error sending JWT token update to background from ${source}:`, error);
    });
  }, 1000); // 1 second debounce
}

// Monitor localStorage changes with debouncing
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key.includes('jwt_token') || key.includes('sabapplier_jwt_token')) {
    debouncedTokenUpdate(key, value, 'localStorage');
  }
  
  originalSetItem.apply(this, arguments);
};

// Monitor sessionStorage changes with debouncing
const originalSessionSetItem = sessionStorage.setItem;
sessionStorage.setItem = function(key, value) {
  if (key.includes('jwt_token') || key.includes('sabapplier_jwt_token')) {
    debouncedTokenUpdate(key, value, 'sessionStorage');
  }
  
  originalSessionSetItem.apply(this, arguments);
};

// Listen for logout events (with debouncing)
let logoutTimeout = null;
window.addEventListener('beforeunload', function() {
  // Check if tokens are being cleared (logout)
  const localJWT = localStorage.getItem('sabapplier_jwt_token') || localStorage.getItem('jwt_token');
  const sessionJWT = sessionStorage.getItem('sabapplier_jwt_token') || sessionStorage.getItem('jwt_token');
  
  if (!localJWT && !sessionJWT) {
    if (logoutTimeout) {
      clearTimeout(logoutTimeout);
    }
    
    logoutTimeout = setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'JWT_TOKEN_CLEARED',
        timestamp: Date.now()
      }).catch(error => {
        console.error('Error sending JWT token clear to background:', error);
      });
    }, 500); // 500ms debounce for logout
  }
});

// Inject a script to monitor for custom events from the website
const script = document.createElement('script');
script.textContent = `
  // Monitor for custom JWT events
  window.addEventListener('sabapplier_jwt_login', function(event) {
    window.postMessage({
      type: 'SABAPPLIER_JWT_TOKEN',
      token: event.detail.token,
      userData: event.detail.userData
    }, window.location.origin);
  });
  
  window.addEventListener('sabapplier_jwt_logout', function(event) {
    window.postMessage({
      type: 'SABAPPLIER_JWT_LOGOUT'
    }, window.location.origin);
  });
`;
document.head.appendChild(script);

// =========================
// EXISTING FORM CAPTURE CODE
// =========================

// SabApplier AI Content Script
// Automatically captures form data and sends to extension sidebar

let capturedFormData = [];
let isCapturing = true;
let lastInputTime = null;
let debounceTimer = null;
let autofilledData = []; // Track autofilled data
let originalAutofilledValues = new Map(); // Store original autofilled values
let isAdaptiveLearningEnabled = true;

// Initialize the content script
function initialize() {
    console.log('SabApplier AI: Content script initialized');
    
    // Start capturing form data automatically
    startFormCapture();
    
    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'getFormData') {
            sendResponse({ success: true, data: capturedFormData });
        } else if (message.action === 'clearFormData') {
            capturedFormData = [];
            sendResponse({ success: true });
        } else if (message.action === 'autoFillForm') {
            // Store autofilled data for adaptive learning
            if (message.data && Array.isArray(message.data)) {
                autofilledData = [...message.data];
                storeOriginalAutofilledValues(message.data);
            }
            autoFillForm(message.data);
            sendResponse({ success: true });
        } else if (message.action === 'setAdaptiveLearning') {
            isAdaptiveLearningEnabled = message.enabled !== false;
            sendResponse({ success: true });
        } else if (message.action === 'startFormMonitoring') {
            console.log('SabApplier AI: Starting form monitoring');
            startFormCapture();
            sendResponse({ success: true });
        }
    });
}

// Store original autofilled values for comparison
function storeOriginalAutofilledValues(data) {
    originalAutofilledValues.clear();
    data.forEach(item => {
        const selector = Object.keys(item).find(k => k !== "type");
        const value = item[selector];
        if (selector && value) {
            originalAutofilledValues.set(selector, value);
        }
    });
}

// Start capturing form data
function startFormCapture() {
    console.log('SabApplier AI: Starting form capture');
    
    // Monitor form elements for changes
    const formElements = document.querySelectorAll('input, select, textarea');
    
    formElements.forEach(element => {
        element.addEventListener('input', handleInputChange);
        element.addEventListener('change', handleInputChange);
        element.addEventListener('blur', handleInputChange);
    });
    
    // Monitor form submissions for adaptive learning
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmission);
    });
    
    // Monitor submit buttons and application buttons
    const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
    const potentialSubmitButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = btn.textContent.toLowerCase();
        return text.includes('submit') || text.includes('apply') || text.includes('send') || text.includes('save');
    });
    
    [...submitButtons, ...potentialSubmitButtons].forEach(button => {
        button.addEventListener('click', handlePotentialSubmission);
    });
    
    // Use MutationObserver to detect new form elements
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const newFormElements = node.querySelectorAll('input, select, textarea');
                    newFormElements.forEach(element => {
                        element.addEventListener('input', handleInputChange);
                        element.addEventListener('change', handleInputChange);
                        element.addEventListener('blur', handleInputChange);
                    });
                    
                    // Add form submission listeners to new forms
                    const newForms = node.querySelectorAll('form');
                    newForms.forEach(form => {
                        form.addEventListener('submit', handleFormSubmission);
                    });
                    
                    // Add click listeners to new submit buttons
                    const newSubmitButtons = node.querySelectorAll('button[type="submit"], input[type="submit"]');
                    const newPotentialSubmitButtons = Array.from(node.querySelectorAll('button')).filter(btn => {
                        const text = btn.textContent.toLowerCase();
                        return text.includes('submit') || text.includes('apply') || text.includes('send') || text.includes('save');
                    });
                    
                    [...newSubmitButtons, ...newPotentialSubmitButtons].forEach(button => {
                        button.addEventListener('click', handlePotentialSubmission);
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// Handle form submission
function handleFormSubmission(event) {
    console.log('SabApplier AI: Form submission detected');
    
    // Capture final form data
    captureFormData();
    
    // Check if popup mode is enabled and trigger adaptive learning
    setTimeout(() => {
        checkAndTriggerAdaptiveLearning();
    }, 1000); // Delay to ensure form data is captured
}

// Handle potential submission (button clicks)
function handlePotentialSubmission(event) {
    const button = event.target;
    const buttonText = button.textContent.toLowerCase();
    
    console.log('SabApplier AI: Button clicked:', buttonText);
    
    // Check if this looks like a submit button
    if (buttonText.includes('submit') || 
        buttonText.includes('apply') || 
        buttonText.includes('send') || 
        buttonText.includes('save') ||
        button.type === 'submit') {
        
        console.log('SabApplier AI: Submit-like button detected');
        
        // Capture final form data
        captureFormData();
        
        // Check if popup mode is enabled and trigger adaptive learning
        setTimeout(() => {
            checkAndTriggerAdaptiveLearning();
        }, 1000); // Delay to ensure form data is captured
    }
}

// Check if adaptive learning should be triggered
async function checkAndTriggerAdaptiveLearning() {
    console.log('SabApplier AI: Checking for adaptive learning data');
    console.log('SabApplier AI: Original autofilled values:', Array.from(originalAutofilledValues.entries()));
    console.log('SabApplier AI: Current form data:', capturedFormData);
    
    // First check if popup mode is enabled for the current user
    try {
        const userEmail = await getCurrentUserEmail();
        if (!userEmail) {
            console.log('SabApplier AI: No user logged in, userEmail:', userEmail);
            return;
        }
        
        console.log('SabApplier AI: Checking popup mode for user:', userEmail);
        const popupModeResponse = await fetch(`http://127.0.0.1:8000/api/users/extension/get-popup-mode/?user_email=${encodeURIComponent(userEmail)}`);
        const popupModeData = await popupModeResponse.json();
        
        console.log('SabApplier AI: Popup mode response:', popupModeData);
        
        if (!popupModeData.success || !popupModeData.enabled) {
            console.log('SabApplier AI: Popup mode disabled for user');
            return;
        }
        
        console.log('SabApplier AI: Popup mode enabled, proceeding with adaptive learning check');
    } catch (error) {
        console.error('SabApplier AI: Error checking popup mode:', error);
        return;
    }
    
    // Compare current form data with original autofilled data
    if (originalAutofilledValues.size > 0 && capturedFormData.length > 0) {
        const adaptiveData = [];
        
        capturedFormData.forEach(fieldData => {
            const selector = fieldData.selector;
            const currentValue = fieldData.value;
            const originalValue = originalAutofilledValues.get(selector);
            
            if (originalValue && originalValue !== currentValue) {
                adaptiveData.push({
                    selector: selector,
                    originalValue: originalValue,
                    currentValue: currentValue,
                    type: fieldData.type,
                    label: fieldData.label,
                    timestamp: Date.now()
                });
            }
        });
        
        if (adaptiveData.length > 0) {
            console.log('SabApplier AI: Adaptive learning data found:', adaptiveData);
            
            // Save adaptive learning data and trigger popup
            const saveResponse = await chrome.runtime.sendMessage({
                action: 'saveAdaptiveLearningData',
                data: adaptiveData
            });
            console.log('SabApplier AI: Save response:', saveResponse);
            
            // Open data preview/popup
            const previewResponse = await chrome.runtime.sendMessage({
                action: 'openDataPreview'
            });
            console.log('SabApplier AI: Preview response:', previewResponse);
        } else {
            console.log('SabApplier AI: No changes detected for adaptive learning');
        }
    } else {
        console.log('SabApplier AI: No original autofilled data to compare');
    }
}

// Get current user email from storage
async function getCurrentUserEmail() {
    try {
        const result = await chrome.storage.local.get(['user_data']);
        return result.user_data?.email || null;
    } catch (error) {
        console.error('Error getting user email:', error);
        return null;
    }
}

// Handle input changes
function handleInputChange(event) {
    if (!isCapturing) return;
    
    const element = event.target;
    lastInputTime = Date.now();
    
    // Clear previous debounce timer
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    
    // Debounce the capture to avoid excessive updates
    debounceTimer = setTimeout(() => {
        captureFormData();
    }, 500);
}

// Capture form data from the current page
function captureFormData() {
    console.log('SabApplier AI: Capturing form data');
    
    const formData = [];
    const formElements = document.querySelectorAll('input, select, textarea');
    
    formElements.forEach(element => {
        if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button') {
            return;
        }
        
        const selector = generateSelector(element);
        const value = element.value;
        
        if (value && value.trim() !== '') {
            const fieldData = {
                selector: selector,
                value: value,
                type: element.type,
                name: element.name,
                id: element.id,
                placeholder: element.placeholder,
                label: getFieldLabel(element),
                timestamp: Date.now()
            };
            
            formData.push(fieldData);
        }
    });
    
    // Only update if data has changed
    if (JSON.stringify(formData) !== JSON.stringify(capturedFormData)) {
        capturedFormData = formData;
        console.log('SabApplier AI: Form data captured:', formData.length, 'fields');
        
        // Save captured data to storage for preview functionality
        const websiteInfo = {
            url: window.location.href,
            domain: window.location.hostname,
            title: document.title
        };
        
        // Convert form data to preview format
        const previewData = formData.map(field => ({
            [field.selector]: field.value,
            type: field.type || 'input'
        }));
        
        // Save to chrome storage
        chrome.runtime.sendMessage({
            action: 'saveCapturedData',
            data: previewData,
            website: websiteInfo,
            originalData: autofilledData
        });
    }
}

// Generate a unique selector for an element
function generateSelector(element) {
    if (element.id) {
        return `#${element.id}`;
    }
    
    if (element.name) {
        return `[name="${element.name}"]`;
    }
    
    // Create a more specific selector
    let selector = element.tagName.toLowerCase();
    
    if (element.type) {
        selector += `[type="${element.type}"]`;
    }
    
    if (element.className) {
        const classes = element.className.split(' ').filter(c => c.length > 0);
        if (classes.length > 0) {
            selector += '.' + classes.join('.');
        }
    }
    
    return selector;
}

// Get field label
function getFieldLabel(element) {
    // Try to find label by 'for' attribute
    if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) return label.textContent.trim();
    }
    
    // Try to find label by parent
    const parentLabel = element.closest('label');
    if (parentLabel) {
        return parentLabel.textContent.replace(element.value, '').trim();
    }
    
    // Try to find label by proximity
    const prevElement = element.previousElementSibling;
    if (prevElement && prevElement.tagName === 'LABEL') {
        return prevElement.textContent.trim();
    }
    
    return element.placeholder || element.name || '';
}

// Auto-fill form with provided data
function autoFillForm(data) {
    console.log('SabApplier AI: Auto-filling form with data:', data);
    
    if (!data || !Array.isArray(data)) {
        console.error('SabApplier AI: Invalid data provided for auto-fill');
        return;
    }
    
    let filledCount = 0;
    
    data.forEach(item => {
        const selector = Object.keys(item).find(k => k !== "type");
        const value = item[selector];
        
        if (selector && value) {
            const elements = document.querySelectorAll(selector);
            
            elements.forEach(element => {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = value === 'true' || value === true;
                } else if (element.tagName === 'SELECT') {
                    // For select elements, try to find the option
                    const option = Array.from(element.options).find(opt => 
                        opt.value === value || opt.text === value
                    );
                    if (option) {
                        element.selectedIndex = option.index;
                    }
                } else {
                    element.value = value;
                }
                
                // Trigger change event
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                
                filledCount++;
            });
        }
    });
    
    console.log(`SabApplier AI: Auto-filled ${filledCount} fields`);
}

// Initialize when the content script loads
initialize();
