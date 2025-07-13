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
    console.log('SabApplier AI: Stored original autofilled values:', originalAutofilledValues);
}

// Start automatic form data capture
function startFormCapture() {
    isCapturing = true;
    
    // Monitor form inputs
    document.addEventListener('input', handleInputChange, true);
    document.addEventListener('change', handleInputChange, true);
    document.addEventListener('blur', handleInputChange, true);
    
    // Monitor form submissions and button clicks
    document.addEventListener('submit', handleFormSubmit, true);
    document.addEventListener('click', handleButtonClick, true);
    
    // Monitor page navigation
    window.addEventListener('beforeunload', handlePageNavigation);
    
    // Monitor dynamic content changes
    const observer = new MutationObserver(handleDOMChanges);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('SabApplier AI: Form capture started');
}

// Handle input changes with debouncing
function handleInputChange(event) {
    if (!isCapturing) return;
    
    const target = event.target;
    if (!isFormField(target)) return;
    
    // Debounce to avoid too many captures
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        captureFormField(target);
    }, 500);
}

// Check if user has changed autofilled data
function checkForAdaptiveLearningChanges(field) {
    const selector = generateSelector(field);
    const currentValue = field.value ? field.value.trim() : '';
    const originalValue = originalAutofilledValues.get(selector);
    
    if (originalValue && currentValue !== originalValue) {
        console.log('SabApplier AI: Detected change in autofilled field:', {
            selector,
            originalValue,
            currentValue
        });
        
        // Store the changed data for later processing
        const changedData = {
            selector: selector,
            originalValue: originalValue,
            currentValue: currentValue,
            type: getFieldType(field),
            timestamp: Date.now()
        };
        
        // Send to background script for adaptive learning
        chrome.runtime.sendMessage({
            action: 'adaptiveLearningData',
            data: changedData,
            url: window.location.href,
            title: document.title
        });
    }
}

// Handle form submissions
function handleFormSubmit(event) {
    if (!isCapturing) return;

    // Show toast notification on every form submit
    chrome.runtime.sendMessage({ action: 'showToast', message: 'Form submitted!' });

    console.log('SabApplier AI: Form submitted, capturing all fields');
    
    // Capture all form fields on submit
    const form = event.target;
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
        if (isFormField(field)) {
            captureFormField(field);
        }
    });
    
    // Check for adaptive learning changes before sending
    if (isAdaptiveLearningEnabled) {
        checkAllFieldsForChanges();
    }
    
    // Send captured data to extension
    sendCapturedData();
}

// Handle button clicks (submit, next, etc.)
function handleButtonClick(event) {
    if (!isCapturing) return;
    
    const target = event.target;
    const buttonText = target.textContent?.toLowerCase() || '';
    const buttonType = target.type?.toLowerCase() || '';
    
    // Check if it's a submit button or navigation button
    const isSubmitButton = buttonType === 'submit' || 
                          buttonText.includes('submit') || 
                          buttonText.includes('next') || 
                          buttonText.includes('continue') || 
                          buttonText.includes('save') ||
                          buttonText.includes('proceed') ||
                          buttonText.includes('finish');
    
    if (isSubmitButton) {
        console.log('SabApplier AI: Submit/Next button clicked, capturing form data');
        
        // Check for adaptive learning changes before capturing
        if (isAdaptiveLearningEnabled) {
            checkAllFieldsForChanges();
        }
        
        // Find the closest form or capture all visible form fields
        const form = target.closest('form');
        if (form) {
            const fields = form.querySelectorAll('input, textarea, select');
            fields.forEach(field => {
                if (isFormField(field)) {
                    captureFormField(field);
                }
            });
        } else {
            // If no form found, capture all visible form fields on the page
            const allFields = document.querySelectorAll('input, textarea, select');
            allFields.forEach(field => {
                if (isFormField(field) && isElementVisible(field)) {
                    captureFormField(field);
                }
            });
        }
        
        // Send captured data to extension
        sendCapturedData();
    }
}

// Handle page navigation
function handlePageNavigation(event) {
    if (!isCapturing || !isAdaptiveLearningEnabled) return;
    
    console.log('SabApplier AI: Page navigation detected, checking for changes');
    checkAllFieldsForChanges();
}

// Check all fields for adaptive learning changes
function checkAllFieldsForChanges() {
    const allFields = document.querySelectorAll('input, textarea, select');
    const changedFields = [];
    
    allFields.forEach(field => {
        if (isFormField(field)) {
            const selector = generateSelector(field);
            const currentValue = field.value ? field.value.trim() : '';
            const originalValue = originalAutofilledValues.get(selector);
            
            if (originalValue && currentValue !== originalValue) {
                changedFields.push({
                    selector: selector,
                    originalValue: originalValue,
                    currentValue: currentValue,
                    type: getFieldType(field),
                    timestamp: Date.now()
                });
            }
        }
    });
    
    if (changedFields.length > 0) {
        console.log('SabApplier AI: Found changed fields:', changedFields);
        
        // Send all changed fields to background script
        chrome.runtime.sendMessage({
            action: 'adaptiveLearningData',
            data: changedFields,
            url: window.location.href,
            title: document.title
        });
    }
}

// Check if element is visible
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && 
           rect.top >= 0 && rect.left >= 0 && 
           rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
}

// Handle DOM changes to capture dynamically added forms
function handleDOMChanges(mutations) {
    if (!isCapturing) return;
    
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
                const inputs = node.querySelectorAll ? node.querySelectorAll('input, textarea, select') : [];
                
                forms.forEach(form => {
                    form.addEventListener('submit', handleFormSubmit, true);
                });
                
                inputs.forEach(input => {
                    if (isFormField(input)) {
                        input.addEventListener('input', handleInputChange, true);
                        input.addEventListener('change', handleInputChange, true);
                        input.addEventListener('blur', handleInputChange, true);
                    }
                });
            }
        });
    });
}

// Check if element is a form field
function isFormField(element) {
    if (!element || !element.tagName) return false;
    
    const tagName = element.tagName.toLowerCase();
    const type = element.type ? element.type.toLowerCase() : '';
    
    // Skip hidden fields, buttons, and file inputs
    if (element.hidden || element.style.display === 'none' || 
        type === 'button' || type === 'submit' || type === 'reset' || 
        type === 'file' || type === 'image') {
        return false;
    }
    
    // Include input, textarea, and select elements
    return (tagName === 'input' && type !== 'button' && type !== 'submit' && type !== 'reset' && type !== 'file' && type !== 'image') ||
           tagName === 'textarea' ||
           tagName === 'select';
}

// Capture a single form field
function captureFormField(field) {
    if (!field) return;
    
    const selector = generateSelector(field);
    const value = field.value ? field.value.trim() : '';
    const type = getFieldType(field);
    
    // Skip empty values
    if (!value) return;
    
    // Check if we already have this field
    const existingIndex = capturedFormData.findIndex(item => {
        const itemSelector = Object.keys(item).find(k => k !== "type");
        return itemSelector === selector;
    });
    
    const fieldData = {
        [selector]: value,
        type: type
    };
    
    if (existingIndex >= 0) {
        // Update existing field
        capturedFormData[existingIndex] = fieldData;
    } else {
        // Add new field
        capturedFormData.push(fieldData);
    }
}

// Generate a unique selector for a field
function generateSelector(field) {
    // Try ID first
    if (field.id) {
        return `#${field.id}`;
    }
    
    // Try name attribute
    if (field.name) {
        return `[name="${field.name}"]`;
    }
    
    // Try placeholder
    if (field.placeholder) {
        return `[placeholder="${field.placeholder}"]`;
    }
    
    // Try aria-label
    if (field.getAttribute('aria-label')) {
        return `[aria-label="${field.getAttribute('aria-label')}"]`;
    }
    
    // Try label association
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label && label.textContent) {
        return `[data-label="${label.textContent.trim()}"]`;
    }
    
    // Fallback to position-based selector
    return generatePositionSelector(field);
}

// Generate position-based selector as fallback
function generatePositionSelector(field) {
    const path = [];
    let current = field;
    
    while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        
        if (current.id) {
            selector = `#${current.id}`;
            path.unshift(selector);
            break;
        } else {
            let nth = 1;
            let sibling = current.previousElementSibling;
            
            while (sibling) {
                if (sibling.tagName === current.tagName) nth++;
                sibling = sibling.previousElementSibling;
            }
            
            if (nth > 1) selector += `:nth-of-type(${nth})`;
        }
        
        path.unshift(selector);
        current = current.parentElement;
    }
    
    return path.join(' > ');
}

// Get field type
function getFieldType(field) {
    const tagName = field.tagName.toLowerCase();
    const type = field.type ? field.type.toLowerCase() : '';
    
    if (tagName === 'textarea') return 'textarea';
    if (tagName === 'select') return 'select';
    if (type === 'checkbox' || type === 'radio') return type;
    return 'input';
}

// Send captured data to extension
function sendCapturedData() {
    if (capturedFormData.length === 0) return;
    
    console.log('SabApplier AI: Sending captured data to extension:', capturedFormData);
    
    // Send to background script
    chrome.runtime.sendMessage({
        action: 'formDataCaptured',
        data: capturedFormData,
        url: window.location.href,
        title: document.title
    });
}

// Stop form capture
function stopFormCapture() {
    isCapturing = false;
    console.log('SabApplier AI: Form capture stopped');
}

// Get all captured form data
function getAllFormData() {
    return capturedFormData;
}

// Auto-fill form with provided data
function autoFillForm(data) {
    if (!Array.isArray(data)) return;
    
    // Store autofilled data for change detection
    autofilledData = [...data];
    storeOriginalAutofilledValues(data);
    
    data.forEach(item => {
        const selector = Object.keys(item).find(k => k !== "type");
        const value = item[selector];
        const type = item.type;
        
        if (!selector || !value) return;
        
        const element = document.querySelector(selector);
        if (!element) return;
        
        try {
            if (type === 'checkbox' || type === 'radio') {
                element.checked = value === 'true';
            } else {
                element.value = value;
            }
            
            // Trigger events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (error) {
            console.error('Error filling field:', selector, error);
        }
    });
    
    // Send autofilled data to background for original value tracking
    chrome.runtime.sendMessage({
        action: 'autoFillForm',
        data: data
    });
    
    console.log('SabApplier AI: Form autofilled and data stored for change detection');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Export functions for external use
window.SabApplierAI = {
    startCapture: startFormCapture,
    stopCapture: stopFormCapture,
    getFormData: getAllFormData,
    autoFill: autoFillForm,
    capturedData: () => capturedFormData,
    storeAutofilledData: (data) => {
        if (data && Array.isArray(data)) {
            autofilledData = [...data];
            storeOriginalAutofilledValues(data);
            console.log('SabApplier AI: Stored autofilled data for adaptive learning:', data);
        }
    }
}; 