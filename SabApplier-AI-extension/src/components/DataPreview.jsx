import React, { useState, useEffect } from 'react';
import { saveLearnedFormData } from '../services/API/LearningAPI';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { 
  Check, 
  X, 
  Globe, 
  RefreshCw, 
  AlertCircle, 
  Save, 
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  Database
} from 'lucide-react';

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
            const response = await chrome.runtime.sendMessage({ action: 'getCapturedData' });
            if (response.success && response.data && response.data.length > 0) {
                setCapturedData(response.data);
                setWebsite(response.website);
                // If original autofilled data is available, store it
                if (response.originalData) {
                    setOriginalData(response.originalData);
                } else {
                    // Try to fetch adaptive learning data as fallback
                    const adaptiveResp = await chrome.runtime.sendMessage({ action: 'getAdaptiveLearningData' });
                    if (adaptiveResp.success && adaptiveResp.data && adaptiveResp.data.length > 0) {
                        setOriginalData(adaptiveResp.data.map(d => ({ [d.selector]: d.originalValue, type: d.type })));
                    }
                }
                // Detect changes between original and captured
                const origData = response.originalData || (originalData.length > 0 ? originalData : null);
                if (origData) {
                    const changes = [];
                    response.data.forEach((item, idx) => {
                        const selector = Object.keys(item).find(k => k !== 'type');
                        const origItem = origData.find(od => Object.keys(od).find(k => k !== 'type') === selector);
                        if (origItem) {
                            const origSelector = Object.keys(origItem).find(k => k !== 'type');
                            if (item[selector] !== origItem[origSelector]) {
                                changes.push({
                                    selector,
                                    before: origItem[origSelector],
                                    after: item[selector],
                                    type: item.type
                                });
                            }
                        }
                    });
                    setChangedData(changes);
                    setShowChangePopup(changes.length > 0);
                }
            }
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
            await chrome.runtime.sendMessage({ action: 'clearCapturedData' });
            setCapturedData([]);
            setWebsite(null);
            setSelectedIndexes([]);
            setSelectAll(false);
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
            await chrome.runtime.sendMessage({ action: 'clearCapturedData' });
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
            await chrome.runtime.sendMessage({ action: 'clearCapturedData' });
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
            <div className="h-full flex flex-col bg-white overflow-hidden">
                <div className="flex-1 w-full mx-auto px-3 pt-20 pb-3 space-y-3 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center h-full">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                        <div className="text-sm font-semibold text-blue-700">Loading data...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (capturedData.length === 0) {
        return (
            <div className="h-full flex flex-col bg-white overflow-hidden">
                <div className="flex-1 w-full mx-auto px-3 pt-20 pb-3 space-y-3 overflow-y-auto">
                    <div className="text-center py-16 animate-fadeIn">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Eye className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Data Captured or Changed
                        </h3>
                        <p className="text-gray-600 text-sm max-w-md mx-auto">
                            Fill out forms or modify autofilled data to see it here for review and saving.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {renderChangePopup()}
            {/* Main Content */}
            <div className="flex-1 w-full mx-auto px-3 pt-20 pb-3 space-y-3 overflow-y-auto">
                {/* Enhanced Header */}
                <div className="text-center mb-3 animate-fadeIn">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Eye className="w-5 h-5 text-green-600" />
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Form Data Preview</h1>
                    </div>
                    <p className="text-xs text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {website ? `Data captured from ${website.title || website.domain || website.url}` : 'Review and save captured form data.'}
                    </p>
                </div>

                {/* Select All Checkbox */}
                <div className="flex items-center mb-3">
                    <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="mr-2 w-3 h-3 accent-blue-600"
                        id="select-all-checkbox"
                    />
                    <label htmlFor="select-all-checkbox" className="text-xs font-medium text-gray-700">
                        Select All ({selectedIndexes.length}/{capturedData.length})
                    </label>
                </div>

                {/* Data List */}
                <div className="space-y-2 mb-4">
                    {capturedData.map((item, index) => {
                        const selector = Object.keys(item).find(k => k !== "type");
                        const value = item[selector];
                        const type = item.type;
                        const checked = selectedIndexes.includes(index);
                        return (
                            <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm flex items-center">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleSelect(index)}
                                    className="mr-3 w-3 h-3 accent-blue-600"
                                    id={`select-data-${index}`}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 text-xs">
                                                {formatLabel(selector)}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {type}
                                            </p>
                                        </div>
                                        {value && (
                                            <button
                                                onClick={() => copyToClipboard(value, formatLabel(selector))}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition font-semibold"
                                            >
                                                Copy
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-gray-700 text-xs">
                                        {!value ? (
                                            <span className="text-gray-400 italic">No data</span>
                                        ) : (
                                            <div className="bg-gray-50 rounded p-2 border border-gray-200 break-all">
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
                <div className="flex gap-2">
                    <button
                        onClick={handleSaveData}
                        disabled={loading || selectedIndexes.length === 0}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all duration-300 text-xs"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-1">
                                <Save className="w-3 h-3" />
                                Save Data ({selectedIndexes.length})
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleSkipData}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all duration-300 text-xs"
                    >
                        <span className="flex items-center justify-center gap-1">
                            <X className="w-3 h-3" />
                            Skip
                        </span>
                    </button>
                </div>

                {/* Status Message */}
                {status && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-center text-xs font-medium">{status}</p>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <Footer />
        </div>
    );
};

export default DataPreview; 