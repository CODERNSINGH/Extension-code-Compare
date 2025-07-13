import React, { useState, useEffect } from 'react';
import { Rocket, LogOut, PenSquare, Settings } from 'lucide-react';

import EmailLogin from '../services/API/EmailLogin';
import Loader from './Loader';
import Footer from './Footer';
import DashboardAccountSwitcher from './DashboardAccountSwitcher';
import DataSourceSelector from './DataSourceSelector';
import DataPreview from './DataPreview';
import FilledDetails from './FilledDetails';
import { isValidUser, getUserDisplayName } from '../utils/userHelpers';

export default function Dashboard({ user, onLogout }) {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [savedUsers, setSavedUsers] = useState([]);
  const [currentDataSource, setCurrentDataSource] = useState(null); // Track current data source
  const [showSettings, setShowSettings] = useState(false);
  const [syncConfig, setSyncConfig] = useState({
    autoSync: true,
    pollingInterval: 10000,
    debounceTime: 2000,
    maxFailures: 3
  });
  const [unfilledFields, setUnfilledFields] = useState([]);
  const [showFilledDetails, setShowFilledDetails] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [autofillResults, setAutofillResults] = useState(null);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [hasChangedFields, setHasChangedFields] = useState(false);

  // Add diagnostic logging
  useEffect(() => {
    console.log('Dashboard mounted with user:', user);
    if (!isValidUser(user)) {
      console.error('Dashboard received invalid user object');
      setError('Invalid user information');
    }
    
    // Load saved users and check for selected data source
    loadSavedUsers();
    loadCurrentDataSource();
    loadSyncConfig();
  }, [user]);
  
  // Load current data source from storage
  const loadCurrentDataSource = () => {
    if (!chrome?.storage?.local) {
      console.log('Chrome storage not available, using default data source');
      return;
    }
    
    chrome.storage.local.get(['sabapplier_last_user'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading current data source:', chrome.runtime.lastError);
        return;
      }
      
      const lastUser = result.sabapplier_last_user;
      console.log('Loaded current data source:', lastUser);
      
      if (lastUser) {
        setCurrentDataSource(lastUser);
      }
    });
  };
  
  // Load saved users from chrome storage and API
  const loadSavedUsers = () => {
    console.log('Attempting to load saved users and shared accounts...');
    
    // For debugging - add a mock user if Chrome storage is not available
    if (!chrome?.storage?.local) {
      console.log('Chrome storage not available, using mock data');
      const mockUsers = {
        'test@example.com': { name: 'Test User' },
        'demo@example.com': { name: 'Demo User' }
      };
      setSavedUsers(Object.entries(mockUsers));
      return;
    }
    
    // First get local saved users
    chrome.storage.local.get(['sabapplier_users'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading saved users:', chrome.runtime.lastError);
        return;
      }
      
      const users = result.sabapplier_users || {};
      console.log('Loaded saved users in Dashboard:', users);
      
      // Add current user to saved users if not already present
      if (user && user.email && !users[user.email]) {
        const updatedUsers = {
          ...users,
          [user.email]: { name: user.name || user.email.split('@')[0] }
        };
        console.log('Added current user to saved users:', updatedUsers);
        
        // Save updated users
        chrome.storage.local.set({
          sabapplier_users: updatedUsers
        }, () => {
          console.log('Updated saved users with current user');
          // Now fetch shared accounts
          fetchSharedAccounts(updatedUsers);
        });
      } else {
        // Fetch shared accounts
        fetchSharedAccounts(users);
      }
    });
  };
  
  // Helper function to fetch shared accounts from API
  const fetchSharedAccounts = (localUsers) => {
    if (!user || !user.email) {
      setSavedUsers(Object.entries(localUsers));
      return;
    }
    
    // For testing purposes, add some mock shared accounts when in development mode
    const useMockData = false; // Set to true for testing without API
    
    if (useMockData) {
      console.log('Using mock shared accounts data for development');
      
      // Add mock shared accounts
      const mockSharedUsers = {
        'friend@example.com': { 
          name: 'Friend User', 
          type: 'shared',
          sharedAt: new Date().toISOString(),
          shareId: 'mock-share-123'
        },
        'colleague@example.com': { 
          name: 'Colleague', 
          type: 'shared',
          sharedAt: new Date().toISOString(),
          shareId: 'mock-share-456'
        }
      };
      
      // Merge local users with mock shared accounts
      const mergedUsers = { ...localUsers, ...mockSharedUsers };
      console.log('Merged users with mock shared accounts:', mergedUsers);
      
      setSavedUsers(Object.entries(mergedUsers));
      return;
    }
    
    // Real implementation - fetch shared accounts from API
    const apiUrl = `https://api.sabapplier.com/api/users/shared-accounts/?email=${encodeURIComponent(user.email)}`;
    console.log('Fetching shared accounts from:', apiUrl);
    
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch shared accounts: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Shared accounts from API:', data);
        
        // Convert API response to our format
        const sharedUsers = {};
        if (data.accounts && Array.isArray(data.accounts)) {
          data.accounts.forEach(account => {
            // Skip self account as we already have it
            if (account.type !== 'self') {
              sharedUsers[account.email] = { 
                name: account.name || account.email.split('@')[0],
                type: 'shared',
                sharedAt: account.shared_at,
                shareId: account.share_id
              };
            }
          });
        }
        
        // Merge local users with shared accounts
        const mergedUsers = { ...localUsers, ...sharedUsers };
        console.log('Merged users with shared accounts:', mergedUsers);
        
        setSavedUsers(Object.entries(mergedUsers));
      })
      .catch(error => {
        console.error('Error fetching shared accounts:', error);
        // Fall back to just local users
        setSavedUsers(Object.entries(localUsers));
      });
  };

  // Load sync configuration
  const loadSyncConfig = () => {
    if (!chrome?.runtime?.sendMessage) return;
    
    chrome.runtime.sendMessage({ action: 'GET_SYNC_CONFIG' }, (response) => {
      if (response && response.success) {
        setSyncConfig(response.config);
      }
    });
  };

  // Update sync configuration
  const updateSyncConfig = (newConfig) => {
    if (!chrome?.runtime?.sendMessage) return;
    
    chrome.runtime.sendMessage({ 
      action: 'UPDATE_SYNC_CONFIG', 
      config: newConfig 
    }, (response) => {
      if (response && response.success) {
        setSyncConfig(response.config);
        setStatus('Settings updated successfully!');
        setTimeout(() => setStatus(''), 3000);
      }
    });
  };

  // Handle data source selection
  const handleAccountSelect = async (email, data) => {
    setLoading(true);
    
    const isSharedAccount = data.type === 'shared';
    const displayName = data.name || email.split('@')[0];
    
    setStatus(`${isSharedAccount ? 'Switching to ' + displayName + '\'s data' : 'Using my own data'}...`);
    
    if (!email || !data) {
      setStatus('Data source not found');
      setTimeout(() => setLoading(false), 3000);
      return;
    }

    try {
      // Prepare the data source object
      const dataSourceData = { 
        email, 
        name: displayName,
        type: data.type || 'self',
        isShared: isSharedAccount,
        shareId: data.shareId || null
      };
      
      console.log('Switching data source:', dataSourceData);
      
      // Update the current data source state
      setCurrentDataSource(dataSourceData);
      
      // Save selected data source to storage
      if (chrome?.storage?.local) {
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({
            sabapplier_last_user: dataSourceData
          }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
      
      setStatus(`Now using ${isSharedAccount ? displayName + '\'s' : 'your own'} data for autofill`);
      setTimeout(() => {
        setLoading(false);
        setStatus('');
      }, 2000);
      
    } catch (err) {
      console.error('Error selecting data source:', err);
      setStatus('Error selecting data source');
      setTimeout(() => setLoading(false), 3000);
    }
  };

  // Modified handleAutoFill to not show DataPreview immediately
  const handleAutoFill = async () => {
    console.log('AutoFill triggered');
    setLoading(true);
    setStatus('Filling form data...');
    setShowSuccess(false);
    setError(null);

    try {
      if (!user || !user.email) {
        throw new Error('User email is missing. Please log in again.');
      }
      // Determine which data source to use
      const dataSource = currentDataSource || user;
      const isUsingSharedAccount = dataSource.isShared === true || dataSource.type === 'shared';
      let loginParams;
      if (isUsingSharedAccount) {
        loginParams = {
          userEmail: user.email,
          sharedAccountEmail: dataSource.email,
          shareId: dataSource.shareId
        };
      } else {
        loginParams = user.email;
      }
      const response = await EmailLogin(loginParams, (msg) => {
        setStatus(msg);
      });
      setAutofillResults(response);
      // Check for unfilled fields (backend should return this in response.fillResults.notFilled)
      if (response && response.fillResults) {
        const { notFilled, filled } = response.fillResults;
        if (notFilled && notFilled.length > 0) {
          setUnfilledFields(notFilled);
          setShowFilledDetails(true);
          setStatus(`${notFilled.length} fields could not be filled automatically. Click to review.`);
        } else {
          setUnfilledFields([]);
          setShowFilledDetails(false);
        }
        // Check if there are changed fields for preview
        // We'll use a helper to check for changed fields
        checkForChangedFields(response);
      } else {
        setStatus('Form Data Filled Successfully');
        setShowSuccess(true);
        setUnfilledFields([]);
        setShowFilledDetails(false);
        setHasChangedFields(false);
      }
      setTimeout(() => setLoading(false), 3000);
    } catch (err) {
      setStatus('Failed to fill form: ' + err.message);
      setTimeout(() => setLoading(false), 3000);
    }
  };

  // Helper to check for changed fields (simulate what DataPreview does)
  const checkForChangedFields = (autofillResults) => {
    // This logic should match DataPreview's changed fields detection
    // For now, we assume autofillResults contains filled and notFilled arrays
    if (!autofillResults || !autofillResults.fillResults) {
      setHasChangedFields(false);
      return;
    }
    const { filled, notFilled } = autofillResults.fillResults;
    // If filled fields exist, and any of them have a 'changed' property or similar, set true
    // For now, just check if filled exists and has length
    if (filled && filled.length > 0) {
      setHasChangedFields(true);
    } else {
      setHasChangedFields(false);
    }
  };

  // Handler for Save/Submit button
  const handleSaveSubmit = () => {
    // After Save/Submit, show the preview popup if there are changed fields
    if (hasChangedFields) {
      setShowPreviewPopup(true);
    } else {
      setStatus('No changes to preview.');
    }
  };

  // Handler for clicking the preview popup
  const handleOpenDataPreview = () => {
    setShowPreviewPopup(false);
    setShowDataPreview(true);
  };

  // If there's an error with the component, display a fallback
  if (error) {
    return (
      <div className="p-8 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-lg border border-red-300/20">
        <div className="text-center mb-6">
          <h3 className="mt-4 text-xl font-bold text-white">Something went wrong</h3>
          <p className="mt-2 text-gray-400">{error}</p>
        </div>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Reload
          </button>
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded-lg flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden" data-testid="dashboard">
      {/* Simple Dashboard */}
      <div className="flex-1 bg-white py-3 overflow-hidden">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-full">
          <div className="flex flex-col justify-center h-full text-center">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    Welcome back, {getUserDisplayName(user)?.split(' ')[0] || 'User'}! 👋
                  </h1>
                  <p className="text-sm text-gray-600 max-w-2xl">
                    Apply faster & easier with AI-powered automation
                  </p>
                </div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-left">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Auto-Sync Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-gray-700 font-medium">Auto-sync with website</label>
                        <p className="text-sm text-gray-500">Automatically sync login state with SabApplier website</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncConfig.autoSync}
                          onChange={(e) => updateSyncConfig({ ...syncConfig, autoSync: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {syncConfig.autoSync && (
                      <div className="space-y-3 pl-4 border-l-2 border-gray-300">
                        <div>
                          <label className="text-gray-700 font-medium">Sync interval</label>
                          <p className="text-sm text-gray-500">How often to check for login changes</p>
                          <select
                            value={syncConfig.pollingInterval / 1000}
                            onChange={(e) => updateSyncConfig({ 
                              ...syncConfig, 
                              pollingInterval: parseInt(e.target.value) * 1000 
                            })}
                            className="mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value={5}>5 seconds</option>
                            <option value={10}>10 seconds</option>
                            <option value={30}>30 seconds</option>
                            <option value={60}>1 minute</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-gray-700 font-medium">Max consecutive failures</label>
                          <p className="text-sm text-gray-500">Stop checking after this many failed attempts</p>
                          <select
                            value={syncConfig.maxFailures}
                            onChange={(e) => updateSyncConfig({ 
                              ...syncConfig, 
                              maxFailures: parseInt(e.target.value) 
                            })}
                            className="mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value={1}>1 failure</option>
                            <option value={3}>3 failures</option>
                            <option value={5}>5 failures</option>
                            <option value={10}>10 failures</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Data Source Selector */}
              <div className="mb-4 max-w-md mx-auto">
                <DataSourceSelector
                  users={savedUsers}
                  currentUser={user}
                  currentDataSource={currentDataSource}
                  onSelect={handleAccountSelect}
                />
              </div>
              
              {/* Auto Fill Details Section */}
              <div className="mb-4">
                <div className="inline-block p-2">
                  <PenSquare size={32} className="mx-auto mb-2 text-blue-600" />
                  <h3 className="text-base font-bold text-gray-800 mb-2">Auto Fill Details</h3>
                  <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">
                    Automatically fill forms with your saved information on SabAppliers
                  </p>
                </div>
              </div>
              
              {/* Main CTA Button */}
              <div className="mb-3">
                <button
                  onClick={handleAutoFill}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <span className="mr-2">⏳</span>
                      Filling Forms...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      AutoFill Form
                    </>
                  )}
                </button>
                {/* Show Save/Submit button if autofillResults exist and not loading */}
                {autofillResults && !loading && (
                  <button
                    onClick={handleSaveSubmit}
                    className="ml-4 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Save/Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Message */}
      {status && (
        <div className={`mx-auto max-w-2xl px-4 mb-4 ${
          showSuccess 
            ? 'text-green-700 bg-green-100 border-green-200' 
            : 'text-blue-700 bg-blue-100 border-blue-200'
        } rounded-lg p-4 border shadow-sm`}>
          <div className="flex items-center justify-center">
            {loading && <span className="mr-2">⏳</span>}
            <p className="font-medium">{status}</p>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center">
            <div className="mb-4 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-gray-800">{status || 'Processing...'}</p>
          </div>
        </div>
      )}
      
      {status && unfilledFields.length > 0 && showFilledDetails && (
        <div className="fixed bottom-6 right-6 bg-yellow-100 border border-yellow-400 text-yellow-900 px-6 py-4 rounded-xl shadow-lg z-50 animate-fadeIn flex items-center gap-4">
          <span>⚠️</span>
          <span>{status}</span>
          <button
            onClick={() => setShowFilledDetails(true)}
            className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Review Fields
          </button>
        </div>
      )}
      {/* Show FilledDetails modal if needed */}
      {showFilledDetails && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative">
            <button
              onClick={() => setShowFilledDetails(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <span className="text-2xl">&times;</span>
            </button>
            <FilledDetails user={user} autofillData={unfilledFields} />
          </div>
        </div>
      )}
      {/* Show DataPreview modal for adaptation/confirmation */}
      {showDataPreview && hasChangedFields && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative">
            <button
              onClick={() => setShowDataPreview(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <span className="text-2xl">&times;</span>
            </button>
            <DataPreview user={user} autofillResults={autofillResults} />
          </div>
        </div>
      )}
      {/* Add the preview popup after Save/Submit */}
      {showPreviewPopup && (
        <div className="fixed bottom-6 right-6 bg-blue-100 border border-blue-400 text-blue-900 px-6 py-4 rounded-xl shadow-lg z-50 animate-fadeIn flex items-center gap-4">
          <span>ℹ️</span>
          <span>Review your changes before adaptation.</span>
          <button
            onClick={handleOpenDataPreview}
            className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Open Preview
          </button>
        </div>
      )}
      
      <Footer />
    </div>
  );
}
