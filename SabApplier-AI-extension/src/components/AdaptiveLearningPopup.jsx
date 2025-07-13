import React, { useState, useEffect } from 'react';
import { saveLearnedFormData } from '../services/API/LearningAPI';
import { useNavigate } from 'react-router-dom';

const AdaptiveLearningPopup = ({ user, onClose }) => {
    const [adaptiveData, setAdaptiveData] = useState([]);
    const [website, setWebsite] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Poll for adaptive learning data every 2 seconds
        const interval = setInterval(checkForAdaptiveData, 2000);
        checkForAdaptiveData(); // Initial load
        return () => clearInterval(interval);
    }, []);

    const checkForAdaptiveData = async () => {
        try {
            console.log('AdaptiveLearningPopup: Checking for adaptive data...');
            const response = await chrome.runtime.sendMessage({ action: 'getAdaptiveLearningData' });
            console.log('AdaptiveLearningPopup: Response received:', response);
            if (response.success && response.data && response.data.length > 0) {
                console.log('AdaptiveLearningPopup: Setting adaptive data:', response.data);
                setAdaptiveData(response.data);
                setWebsite(response.website);
            } else {
                console.log('AdaptiveLearningPopup: No adaptive data found');
                setAdaptiveData([]);
                setWebsite(null);
            }
        } catch (error) {
            console.error('AdaptiveLearningPopup: Error checking for data:', error);
            setAdaptiveData([]);
            setWebsite(null);
        }
    };

    const handleSaveChanges = async () => {
        if (!user?.email || adaptiveData.length === 0) return;
        setLoading(true);
        setStatus('Saving changes...');
        try {
            // Convert adaptive learning data to form data format
            const formData = adaptiveData.map(item => ({
                [item.selector]: item.currentValue,
                type: item.type
            }));
            await saveLearnedFormData(user.email, formData, website?.url || window.location.href);
            setStatus('Changes saved successfully!');
            // Clear adaptive learning data
            await chrome.runtime.sendMessage({ action: 'clearAdaptiveLearningData' });
            setAdaptiveData([]);
            setWebsite(null);
            setTimeout(() => {
                setStatus('');
                navigate('/data-preview');
                if (onClose) onClose();
            }, 500);
        } catch (error) {
            setStatus('Error saving changes');
        }
        setLoading(false);
    };

    const handleIgnoreChanges = async () => {
        try {
            await chrome.runtime.sendMessage({ action: 'clearAdaptiveLearningData' });
            setAdaptiveData([]);
            setWebsite(null);
            if (onClose) onClose();
        } catch (error) {
            // ignore
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

    if (adaptiveData.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-80 z-50 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🔄</span>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Data Changes Detected
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {adaptiveData.length} field{adaptiveData.length !== 1 ? 's' : ''} modified
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    ✕
                </button>
            </div>
            {/* Changes List */}
            <div className="max-h-32 overflow-y-auto mb-3">
                {adaptiveData.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">{formatLabel(item.selector)}</span>
                        <span className="mx-1">→</span>
                        <span className="text-green-600 dark:text-green-400">{item.currentValue}</span>
                    </div>
                ))}
                {adaptiveData.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{adaptiveData.length - 3} more changes
                    </div>
                )}
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleIgnoreChanges}
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 font-medium"
                >
                    Ignore
                </button>
                <button
                    onClick={handleSaveChanges}
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving...' : 'Save & Preview'}
                </button>
            </div>
            {/* Status Message */}
            {status && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 text-xs text-center">{status}</p>
                </div>
            )}
        </div>
    );
};

export default AdaptiveLearningPopup; 