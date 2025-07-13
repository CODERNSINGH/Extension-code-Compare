import React, { useState, useEffect } from 'react';
import { saveLearnedFormData } from '../services/API/LearningAPI';
import { useNavigate } from 'react-router-dom';

const DataPreview = ({ user }) => {
    const [capturedData, setCapturedData] = useState([]);
    const [website, setWebsite] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [selectedIndexes, setSelectedIndexes] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [originalData, setOriginalData] = useState([]);
    const [changedData, setChangedData] = useState([]);
    const [showChangePopup, setShowChangePopup] = useState(false);
    const [savingChanges, setSavingChanges] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        // Check for captured data every 2 seconds
        const interval = setInterval(checkForCapturedData, 2000);
        checkForCapturedData(); // Initial load
        // Remove polling for adaptive learning data
        return () => clearInterval(interval);
    }, []);

    // Listen for openDataPreview message to refresh data and focus
    useEffect(() => {
        if (!chrome?.runtime?.onMessage) return;
        const handler = (message, sender, sendResponse) => {
            if (message.action === 'openDataPreview') {
                checkForCapturedData();
                window.focus();
            }
        };
        chrome.runtime.onMessage.addListener(handler);
        return () => chrome.runtime.onMessage.removeListener(handler);
    }, []);

    const checkForCapturedData = async () => {
        try {
            // Get current form data from content script
            const response = await chrome.runtime.sendMessage({ action: 'getCapturedData' });
            
            // Get stored autofilled data
            const autofillResponse = await chrome.runtime.sendMessage({ action: 'getAutofilledData' });
            
            // Get unfilled data from storage
            const unfilledResponse = await chrome.runtime.sendMessage({ action: 'getUnfilledData' });
            
            let allDataToShow = [];
            
            if (response.success && response.data && response.data.length > 0) {
                setWebsite(response.website);
                
                // Get original autofilled data
                let originalAutofilledData = [];
                if (autofillResponse.success && autofillResponse.data) {
                    originalAutofilledData = autofillResponse.data;
                    setOriginalData(originalAutofilledData);
                }
                
                // Only show changed data (user modified after autofill)
                if (originalAutofilledData.length > 0) {
                    const changes = [];
                    response.data.forEach((item) => {
                        const selector = Object.keys(item).find(k => k !== 'type');
                        const currentValue = item[selector];
                        
                        // Find corresponding original autofilled value
                        const origItem = originalAutofilledData.find(od => {
                            const origSelector = Object.keys(od).find(k => k !== 'type');
                            return origSelector === selector;
                        });
                        
                        if (origItem) {
                            const origSelector = Object.keys(origItem).find(k => k !== 'type');
                            const originalValue = origItem[origSelector];
                            
                            // Only include if value was changed by user
                            if (currentValue !== originalValue) {
                                changes.push({
                                    selector,
                                    before: originalValue,
                                    after: currentValue,
                                    type: item.type
                                });
                            }
                        }
                    });
                    
                    setChangedData(changes);
                    allDataToShow = [...changes];
                    setShowChangePopup(changes.length > 0);
                } else {
                    // No autofilled data, show all captured data
                    setChangedData([]);
                    allDataToShow = response.data;
                    setShowChangePopup(false);
                }
            }
            
            // Add unfilled data to show
            if (unfilledResponse.success && unfilledResponse.data && unfilledResponse.data.length > 0) {
                const unfilledData = unfilledResponse.data.map(item => ({
                    [item.selector]: item.value,
                    type: item.type,
                    reason: item.reason,
                    isUnfilled: true
                }));
                allDataToShow = [...allDataToShow, ...unfilledData];
            }
            
            setCapturedData(allDataToShow);
            
        } catch (error) {
            console.error('Error checking for captured data:', error);
        }
        setLoading(false);
    };

    const handleSaveData = async () => {
        if (!user?.email || selectedIndexes.length === 0) return;
        setLoading(true);
        setStatus('Saving data...');
        try {
            // Only save selected data
            const dataToSave = selectedIndexes.map(idx => capturedData[idx]);
            await saveLearnedFormData(user.email, dataToSave, website?.url || window.location.href);
            setStatus('Data saved successfully!');
            // Clear captured data
            await chrome.runtime.sendMessage({ action: 'clearCapturedData' });
            setCapturedData([]);
            setWebsite(null);
            setSelectedIndexes([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Error saving data:', error);
            setStatus('Error saving data');
        }
        setLoading(false);
        setTimeout(() => setStatus(''), 3000);
    };

    const handleSkipData = async () => {
        try {
            await chrome.runtime.sendMessage({ action: 'clearAllData' });
            setCapturedData([]);
            setWebsite(null);
            setSelectedIndexes([]);
            setSelectAll(false);
            setChangedData([]);
            setShowChangePopup(false);
            setStatus('Data skipped');
            setTimeout(() => setStatus(''), 2000);
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    };

    const handleSaveChanges = async () => {
        if (!user?.email || changedData.length === 0) return;
        setSavingChanges(true);
        setStatus('Saving changes...');
        try {
            // Prepare data to save (only changed fields)
            const dataToSave = changedData.map(change => ({ [change.selector]: change.after, type: change.type }));
            await saveLearnedFormData(user.email, dataToSave, website?.url || window.location.href);
            setStatus('Changes saved!');
            // Clear captured data
            await chrome.runtime.sendMessage({ action: 'clearAllData' });
            setCapturedData([]);
            setWebsite(null);
            setSelectedIndexes([]);
            setSelectAll(false);
            setShowChangePopup(false);
            setChangedData([]);
            // Navigate to YourDetails with loading
            setTimeout(() => {
                navigate('/your-details', { state: { loading: true } });
            }, 500);
        } catch (error) {
            console.error('Error saving changes:', error);
            setStatus('Error saving changes');
        }
        setSavingChanges(false);
        setTimeout(() => setStatus(''), 3000);
    };

    const handleSkipChanges = async () => {
        try {
            await chrome.runtime.sendMessage({ action: 'clearAllData' });
            setCapturedData([]);
            setWebsite(null);
            setSelectedIndexes([]);
            setSelectAll(false);
            setShowChangePopup(false);
            setChangedData([]);
            setStatus('Changes skipped');
            setTimeout(() => setStatus(''), 2000);
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    };

    const formatLabel = (selector) => {
        try {
            let label = selector.replace(/\[name=['"]|['"]\]/g, '').replace(/_/g, ' ').replace(/-/g, ' ').replace(/#/g, '');
            return label.replace(/\b\w/g, l => l.toUpperCase());
        } catch (e) {
            return selector;
        }
    };

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text).then(() => {
            setStatus(`${fieldName} copied!`);
            setTimeout(() => setStatus(''), 2000);
        });
    };

    const handleSelect = (index) => {
        setSelectedIndexes(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedIndexes([]);
            setSelectAll(false);
        } else {
            setSelectedIndexes(capturedData.map((_, idx) => idx));
            setSelectAll(true);
        }
    };

    useEffect(() => {
        if (selectedIndexes.length === capturedData.length && capturedData.length > 0) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedIndexes, capturedData]);

    // Render popup/modal for detected changes at the top level
    const renderChangePopup = () => (
        showChangePopup && changedData.length > 0 && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fadeIn">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Detected Changes</h3>
                    <ul className="mb-6 space-y-2">
                        {changedData.map((change, idx) => (
                            <li key={idx} className="text-sm text-gray-700 dark:text-gray-200">
                                <b>{formatLabel(change.selector)}</b>: <span className="text-yellow-500">{change.before || '—'}</span> → <span className="text-green-500">{change.after}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSkipChanges}
                            className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
                            disabled={savingChanges}
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSaveChanges}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={savingChanges}
                        >
                            {savingChanges ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        )
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950">
                {renderChangePopup()}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <div className="text-lg font-semibold text-blue-700 dark:text-blue-200">Loading data...</div>
                </div>
            </div>
        );
    }

    if (capturedData.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 flex items-center justify-center p-4">
                {renderChangePopup()}
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl">📝</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No Changes or Unfilled Fields
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Run autofill and modify fields or have unfilled fields to see them here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 p-4">
            {renderChangePopup()}
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-lg">📊</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    Changed & Unfilled Data
                </h2>
                {website && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {website.title || website.url}
                    </p>
                )}
            </div>

            {/* Select All Checkbox */}
            <div className="flex items-center mb-4">
                <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="mr-2 w-4 h-4 accent-blue-600"
                    id="select-all-checkbox"
                />
                <label htmlFor="select-all-checkbox" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Select All
                </label>
            </div>

            {/* Data List */}
            <div className="space-y-3 mb-6">
                {capturedData.map((item, index) => {
                    const selector = Object.keys(item).find(k => k !== "type" && k !== "reason" && k !== "isUnfilled");
                    const value = item[selector];
                    const type = item.type;
                    const reason = item.reason;
                    const isUnfilled = item.isUnfilled;
                    const checked = selectedIndexes.includes(index);
                    
                    return (
                        <div key={index} className={`rounded-xl p-4 border shadow-sm flex items-center ${
                            isUnfilled 
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}>
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleSelect(index)}
                                className="mr-4 w-4 h-4 accent-blue-600"
                                id={`select-data-${index}`}
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                            {formatLabel(selector)}
                                            {isUnfilled && (
                                                <span className="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                                                    Unfilled
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {type}
                                            {reason && (
                                                <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                                                    • {reason}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    {value && value !== 'No data available' && (
                                        <button
                                            onClick={() => copyToClipboard(value, formatLabel(selector))}
                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition font-semibold"
                                        >
                                            Copy
                                        </button>
                                    )}
                                </div>
                                <div className="text-gray-700 dark:text-gray-300 text-sm">
                                    {!value || value === 'No data available' ? (
                                        <span className="text-gray-400 dark:text-gray-500 italic">No data available</span>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600 break-all">
                                            {value}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleSaveData}
                    disabled={loading || selectedIndexes.length === 0}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                    {loading ? 'Saving...' : 'Save Data'}
                </button>
                <button
                    onClick={handleSkipData}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-300"
                >
                    Skip
                </button>
            </div>

            {/* Status Message */}
            {status && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-blue-800 dark:text-blue-200 text-center text-sm font-medium">{status}</p>
                </div>
            )}
        </div>
    );
};

export default DataPreview; 