import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from './Loader';
import Footer from './Footer';

const FilledDetails = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [fillResults, setFillResults] = useState(null);
    const [autofillData, setAutofillData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [unfilledFields, setUnfilledFields] = useState([]);
    const [currentUrl, setCurrentUrl] = useState('');

    useEffect(() => {
        // Get current tab URL
        if (chrome?.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    setCurrentUrl(tabs[0].url);
                }
            });
        }

        if (location.state) {
            if (location.state.fillResults) {
                setFillResults(location.state.fillResults);
                processFillResults(location.state.fillResults);
            } else if (location.state.autofillData) {
                setAutofillData(location.state.autofillData);
                processAutofillData(location.state.autofillData);
            }
        }
    }, [location.state]);

    const processFillResults = (results) => {
        if (results && results.unfilled_fields) {
            setUnfilledFields(results.unfilled_fields);
        }
    };

    const processAutofillData = (data) => {
        if (data && Array.isArray(data)) {
            // Convert autofill data to unfilled fields format
            const unfilled = data.map(item => {
                const selector = Object.keys(item).find(k => k !== "type");
                const value = item[selector];
                const type = item.type;
                
                return {
                    selector: selector,
                    value: value,
                    type: type,
                    label: formatLabel(selector),
                    status: 'unfilled'
                };
            });
            setUnfilledFields(unfilled);
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

    const handleFillField = async (field) => {
        setLoading(true);
        setStatus(`Filling ${field.label}...`);

        try {
            // Send message to content script to fill this specific field
            if (chrome?.runtime) {
                chrome.runtime.sendMessage({
                    action: 'autoFillForm',
                    data: [{
                        [field.selector]: field.value,
                        type: field.type
                    }]
                }, (response) => {
                    if (response && response.success) {
                        // Mark field as filled
                        setUnfilledFields(prev => prev.map(f => 
                            f.selector === field.selector ? { ...f, status: 'filled' } : f
                        ));
                        setStatus(`${field.label} filled successfully!`);
                    } else {
                        setStatus(`Failed to fill ${field.label}`);
                    }
                    setLoading(false);
                    setTimeout(() => setStatus(''), 2000);
                });
            }
        } catch (error) {
            setStatus(`Error filling ${field.label}: ${error.message}`);
            setLoading(false);
            setTimeout(() => setStatus(''), 3000);
        }
    };

    const handleFillAll = async () => {
        setLoading(true);
        setStatus('Filling all remaining fields...');

        try {
            if (chrome?.runtime) {
                const remainingFields = unfilledFields.filter(f => f.status === 'unfilled');
                const dataToFill = remainingFields.map(field => ({
                    [field.selector]: field.value,
                    type: field.type
                }));

                chrome.runtime.sendMessage({
                    action: 'autoFillForm',
                    data: dataToFill
                }, (response) => {
                    if (response && response.success) {
                        // Mark all fields as filled
                        setUnfilledFields(prev => prev.map(f => ({ ...f, status: 'filled' })));
                        setStatus('All fields filled successfully!');
                    } else {
                        setStatus('Failed to fill some fields');
                    }
                    setLoading(false);
                    setTimeout(() => setStatus(''), 3000);
                });
            }
        } catch (error) {
            setStatus(`Error filling fields: ${error.message}`);
            setLoading(false);
            setTimeout(() => setStatus(''), 3000);
        }
    };

    const getDomainFromUrl = (url) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url || 'Current Page';
        }
    };

    const getFilledCount = () => unfilledFields.filter(f => f.status === 'filled').length;
    const getUnfilledCount = () => unfilledFields.filter(f => f.status === 'unfilled').length;
    const getTotalCount = () => unfilledFields.length;

    if (unfilledFields.length === 0) {
        return (
            <div className="min-h-full">
                <div className="mb-8">
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="mb-6 px-4 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/40 transition flex items-center gap-2"
                    >
                        ← Back to Dashboard
                    </button>
                    
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">✅</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            No Fields to Fill
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            All form fields have been filled or there are no fields available on this page.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-2 mx-auto"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full">
            {loading && <Loader message={status} />}
            
            {/* Header Section */}
            <div className="mb-8">
                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="mb-6 px-4 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/40 transition flex items-center gap-2"
                >
                    ← Back to Dashboard
                </button>
                
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Form Auto-Fill Results
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        Review and fill the remaining form fields on {getDomainFromUrl(currentUrl)}
                    </p>
                </div>

                {/* Progress Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                <span className="text-white text-xl">✅</span>
                            </div>
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Filled</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{getFilledCount()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                                <span className="text-white text-xl">⏳</span>
                            </div>
                            <div>
                                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Remaining</p>
                                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{getUnfilledCount()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                <span className="text-white text-xl">📊</span>
                            </div>
                            <div>
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{getTotalCount()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {getUnfilledCount() > 0 && (
                    <div className="flex justify-center mb-8">
                        <button
                            onClick={handleFillAll}
                            disabled={loading}
                            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Filling...
                                </>
                            ) : (
                                <>
                                    <span>🚀</span>
                                    Fill All Remaining ({getUnfilledCount()})
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
            
            {/* Fields List */}
            <div className="space-y-4">
                {unfilledFields.map((field, index) => (
                    <div
                        key={index}
                        className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all duration-200 ${
                            field.status === 'filled'
                                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        field.status === 'filled'
                                            ? 'bg-green-100 dark:bg-green-900/30'
                                            : 'bg-orange-100 dark:bg-orange-900/30'
                                    }`}>
                                        <span className="text-sm">
                                            {field.status === 'filled' ? '✅' : '⏳'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {field.label}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {field.type} • {field.selector}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="ml-11">
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
                                            {field.value}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {field.status === 'unfilled' && (
                                <button
                                    onClick={() => handleFillField(field)}
                                    disabled={loading}
                                    className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center gap-2"
                                >
                                    <span>📝</span>
                                    Fill
                                </button>
                            )}
                            
                            {field.status === 'filled' && (
                                <div className="ml-4 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold rounded-xl">
                                    Filled ✓
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Message */}
            {status && (
                <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg z-50">
                    {status}
                </div>
            )}
            
            {/* Footer */}
            <Footer />
        </div>
    );
};

export default FilledDetails; 