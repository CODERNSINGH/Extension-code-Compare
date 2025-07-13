const API_BASE_URL = 'https://api.sabapplier.com/api';
// const API_BASE_URL = 'https://api.sabapplier.com/api';

export const saveLearnedFormData = async (userEmail, formData, currentUrl) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/save-learned-data/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_email: userEmail,
                form_data: formData,
                current_url: currentUrl,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error saving learned form data:', error);
        throw error;
    }
};

export const processLearnedData = async (userEmail) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/process-learned-data/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_email: userEmail,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error processing learned data:', error);
        throw error;
    }
};

export const getLearnedData = async (userEmail) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/get-learned-data/?user_email=${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting learned data:', error);
        throw error;
    }
};

export const startFormMonitoring = () => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({action: 'startFormMonitoring'}, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.success) {
                resolve(response);
            } else {
                reject(new Error(response?.error || 'Failed to start monitoring'));
            }
        });
    });
};

export const stopFormMonitoring = () => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({action: 'stopFormMonitoring'}, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.success) {
                resolve(response);
            } else {
                reject(new Error(response?.error || 'Failed to stop monitoring'));
            }
        });
    });
};

export const getFormData = () => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({action: 'getFormData'}, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response) {
                resolve(response);
            } else {
                reject(new Error('Failed to get form data'));
            }
        });
    });
};

export const clearFormData = () => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({action: 'clearFormData'}, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.success) {
                resolve(response);
            } else {
                reject(new Error(response?.error || 'Failed to clear form data'));
            }
        });
    });
};

export const deleteLearnedData = async (userEmail, field) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/delete/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                field: field,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting learned data:', error);
        throw error;
    }
};

export const deleteLearnedDataEntry = async (userEmail, index) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/delete-learned-data/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_email: userEmail,
                index: index,
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting learned data entry:', error);
        throw error;
    }
};

// New functions for popup mode management
export const togglePopupMode = async (userEmail, enabled) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/toggle-popup-mode/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_email: userEmail,
                enabled: enabled,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error toggling popup mode:', error);
        throw error;
    }
};

export const getPopupMode = async (userEmail) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/get-popup-mode/?user_email=${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting popup mode:', error);
        throw error;
    }
};

// Function to get user's autofill data for comparison
export const getUserAutofillData = async (userEmail) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/get-autofill-data/?user_email=${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting user autofill data:', error);
        throw error;
    }
};

// Function to compare form data with existing autofill data
export const compareFormData = async (userEmail, formData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/compare-form-data/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_email: userEmail,
                form_data: formData,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error comparing form data:', error);
        throw error;
    }
};

// Function to save adaptive learning data
export const saveAdaptiveLearningData = async (userEmail, adaptiveData, currentUrl) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/save-adaptive-learning/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_email: userEmail,
                adaptive_data: adaptiveData,
                current_url: currentUrl,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error saving adaptive learning data:', error);
        throw error;
    }
};

// Function to get adaptive learning data
export const getAdaptiveLearningData = async (userEmail) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/get-adaptive-learning/?user_email=${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting adaptive learning data:', error);
        throw error;
    }
};

// Function to enable/disable adaptive learning
export const toggleAdaptiveLearning = async (userEmail, enabled) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/toggle-adaptive-learning/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_email: userEmail,
                enabled: enabled,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error toggling adaptive learning:', error);
        throw error;
    }
};

// Function to get comprehensive user statistics
export const getUserStats = async (userEmail) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/extension/user-stats/?user_email=${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting user stats:', error);
        throw error;
    }
}; 