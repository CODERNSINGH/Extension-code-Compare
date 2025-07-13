import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from './Loader';

import { deleteLearnedData, saveLearnedFormData, getLearnedData, deleteLearnedDataEntry, getPopupMode, togglePopupMode, getUserAutofillData, getUserStats } from '../services/API/LearningAPI';

const YourDetails = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [autofillData, setAutofillData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newData, setNewData] = useState({ selector: '', value: '', type: 'text', label: '' });
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [learnedDataCount, setLearnedDataCount] = useState(0);
    const [isPopupEnabled, setIsPopupEnabled] = useState(false);
    const [selectedWebsite, setSelectedWebsite] = useState(null);
    const [groupedData, setGroupedData] = useState({});
    const [userStats, setUserStats] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.email) {
                setLoading(true);
                try {
                    const result = await getLearnedData(user.email);
                    console.log('Raw API result:', result);
                    
                    // Use processed_data if available, otherwise fall back to original logic
                    let learned = null;
                    if (result?.processed_data && Array.isArray(result.processed_data)) {
                        learned = result.processed_data;
                        setLearnedDataCount(result.count || learned.length);
                        console.log('Using processed_data:', learned);
                    } else if (result?.learned_data && Array.isArray(result.learned_data)) {
                        // Fallback to original data structure
                        learned = result.learned_data;
                        setLearnedDataCount(learned.length);
                        console.log('Using learned_data:', learned);
                    } else if (result?.data && Array.isArray(result.data)) {
                        learned = result.data;
                        setLearnedDataCount(learned.length);
                        console.log('Using data:', learned);
                    } else if (result?.autofill_data && Array.isArray(result.autofill_data)) {
                        learned = result.autofill_data;
                        setLearnedDataCount(learned.length);
                        console.log('Using autofill_data:', learned);
                    }
                    
                    if (learned && learned.length > 0) {
                        setAutofillData(learned);
                        groupDataByWebsite(learned);
                        console.log('Grouped data:', groupedData);
                    } else {
                        setAutofillData(null);
                        setLearnedDataCount(0);
                        setGroupedData({});
                        setStatus('No learned data found.');
                    }
                } catch (e) {
                    console.error('Error fetching learned data:', e);
                    setStatus('Failed to load data.');
                }
                setLoading(false);
            } else if (location.state && location.state.autofillData) {
                setAutofillData(location.state.autofillData);
                groupDataByWebsite(location.state.autofillData);
            } else {
                setStatus("No learned data found. Go to the dashboard to start learning.");
            }
        };
        fetchData();
        loadPopupMode();
        loadUserStats();
    }, [user?.email, location.state]);

    const groupDataByWebsite = (data) => {
        const grouped = {};
        data.forEach(entry => {
            // Use domain from processed data if available, otherwise extract from URL
            const domain = entry.domain || getDomainFromUrl(entry.url);
            if (!grouped[domain]) {
                grouped[domain] = [];
            }
            grouped[domain].push(entry);
        });
        setGroupedData(grouped);
    };

    const loadPopupMode = async () => {
        try {
            const result = await getPopupMode(user?.email);
            setIsPopupEnabled(result.enabled || false);
        } catch (error) {
            console.error('Error loading popup mode:', error);
        }
    };

    const loadUserStats = async () => {
        if (!user?.email) return;
        try {
            const result = await getUserStats(user.email);
            if (result.success) {
                setUserStats(result);
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    };

    const handleTogglePopupMode = async () => {
        if (!user?.email) return;
        try {
            const newState = !isPopupEnabled;
            await togglePopupMode(user.email, newState);
            setIsPopupEnabled(newState);
            setStatus(`Popup mode ${newState ? 'enabled' : 'disabled'}!`);
            setTimeout(() => setStatus(''), 2000);
        } catch (error) {
            console.error('Error toggling popup mode:', error);
            setStatus('Failed to toggle popup mode.');
            setTimeout(() => setStatus(''), 2000);
        }
    };

    const handleRefreshData = async () => {
        if (!user?.email) return;
        setLoading(true);
        setStatus('Refreshing data...');
        try {
            // Get fresh autofill data
            const autofillResult = await getUserAutofillData(user.email);
            console.log('Fresh autofill data:', autofillResult);
            
            // Re-fetch learned data
            const result = await getLearnedData(user.email);
            
            // Use processed_data if available, otherwise fall back to original logic
            let learned = null;
            if (result?.processed_data && Array.isArray(result.processed_data)) {
                learned = result.processed_data;
                setLearnedDataCount(result.count || learned.length);
            } else if (result?.learned_data && Array.isArray(result.learned_data)) {
                learned = result.learned_data;
                setLearnedDataCount(learned.length);
            } else if (result?.data && Array.isArray(result.data)) {
                learned = result.data;
                setLearnedDataCount(learned.length);
            } else if (result?.autofill_data && Array.isArray(result.autofill_data)) {
                learned = result.autofill_data;
                setLearnedDataCount(learned.length);
            }
            
            if (learned && learned.length > 0) {
                setAutofillData(learned);
                groupDataByWebsite(learned);
            } else {
                setAutofillData(null);
                setLearnedDataCount(0);
                setGroupedData({});
            }
            setStatus('Data refreshed successfully!');
        } catch (e) {
            console.error('Error refreshing data:', e);
            setStatus('Failed to refresh data.');
        }
        setLoading(false);
        setTimeout(() => setStatus(''), 2000);
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
            setStatus(`${fieldName} copied to clipboard!`);
            setTimeout(() => setStatus(''), 2000);
        }, () => {
            setStatus('Failed to copy.');
            setTimeout(() => setStatus(''), 2000);
        });
    };

    const handleRemove = async (selector, index) => {
        if (!user?.email) return;
        setLoading(true);
        setStatus('Removing data...');
        try {
            await deleteLearnedDataEntry(user.email, index);
            // Re-fetch from backend
            const result = await getLearnedData(user.email);
            
            // Use processed_data if available, otherwise fall back to original logic
            let learned = null;
            if (result?.processed_data && Array.isArray(result.processed_data)) {
                learned = result.processed_data;
                setLearnedDataCount(result.count || learned.length);
            } else if (result?.learned_data && Array.isArray(result.learned_data)) {
                learned = result.learned_data;
                setLearnedDataCount(learned.length);
            } else if (result?.data && Array.isArray(result.data)) {
                learned = result.data;
                setLearnedDataCount(learned.length);
            } else if (result?.autofill_data && Array.isArray(result.autofill_data)) {
                learned = result.autofill_data;
                setLearnedDataCount(learned.length);
            }
            
            if (learned && learned.length > 0) {
                setAutofillData(learned);
                groupDataByWebsite(learned);
            } else {
                setAutofillData(null);
                setLearnedDataCount(0);
                setGroupedData({});
            }
            setStatus('Data removed!');
        } catch (e) {
            console.error('Error removing data:', e);
            setStatus('Failed to remove data.');
        }
        setLoading(false);
        setTimeout(() => setStatus(''), 2000);
    };

    const handleAddCustomData = async (e) => {
        e.preventDefault();
        if (!user?.email) return;
        setSaving(true);
        setStatus('Saving custom data...');
        try {
            const formData = [
                { [newData.selector]: newData.value, type: newData.type }
            ];
            await saveLearnedFormData(user.email, formData, window.location.href);
            // Re-fetch from backend
            const result = await getLearnedData(user.email);
            
            // Use processed_data if available, otherwise fall back to original logic
            let learned = null;
            if (result?.processed_data && Array.isArray(result.processed_data)) {
                learned = result.processed_data;
                setLearnedDataCount(result.count || learned.length);
            } else if (result?.learned_data && Array.isArray(result.learned_data)) {
                learned = result.learned_data;
                setLearnedDataCount(learned.length);
            } else if (result?.data && Array.isArray(result.data)) {
                learned = result.data;
                setLearnedDataCount(learned.length);
            } else if (result?.autofill_data && Array.isArray(result.autofill_data)) {
                learned = result.autofill_data;
                setLearnedDataCount(learned.length);
            }
            
            if (learned && learned.length > 0) {
                setAutofillData(learned);
                groupDataByWebsite(learned);
            } else {
                setAutofillData(null);
                setLearnedDataCount(0);
                setGroupedData({});
            }
            setShowAddModal(false);
            setNewData({ selector: '', value: '', type: 'text', label: '' });
            setStatus('Custom data added!');
        } catch (e) {
            console.error('Error adding custom data:', e);
            setStatus('Failed to add data.');
        }
        setSaving(false);
        setTimeout(() => setStatus(''), 2000);
    };

    const getDomainFromUrl = (url) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url || 'Unknown Site';
        }
    };

    const exportDataForDebug = () => {
        const debugData = {
            autofillData,
            groupedData,
            learnedDataCount,
            timestamp: new Date().toISOString()
        };
        console.log('Debug data:', debugData);
        const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'learned-data-debug.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredWebsites = Object.keys(groupedData).filter(domain => {
        if (!searchTerm) return true;
        return domain.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const renderEmptyState = () => (
        <div className="text-center py-16 animate-fadeIn">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-float">
                <span className="text-5xl">📊</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                No Learned Data Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                Start using the AutoFill feature on forms to build your personal data library. 
                Your information will appear here for easy access and management.
            </p>
            <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
                Go to Dashboard
            </button>
        </div>
    );

    if (loading) {
        return <Loader message="Loading your learned data..." />;
    }

    return (
        <div className="min-h-full flex flex-col justify-between bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950">
            {/* Main Content */}
            <div className="flex-1 w-full max-w-6xl mx-auto px-2 md:px-8 py-8 space-y-8">
                {/* Enhanced Header */}
                <div className="text-center mb-8 animate-fadeIn">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">Your Data</h1>
                    <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        View and manage all the form data that SabApplier AI has learned from your interactions.
                    </p>
                </div>

                {/* Search and Stats */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-6 items-center justify-between">
                    <div className="flex-1 w-full">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search websites..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-10 py-2 border border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition placeholder-gray-500 text-sm shadow-sm"
                            />
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                        </div>
                    </div>
                    <div className="flex gap-2 md:gap-4 items-center mt-4 md:mt-0">
                        {userStats && (
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg px-4 py-2 border border-purple-200 dark:border-purple-800 text-xs flex flex-col items-center">
                                <span className="font-semibold text-purple-700 dark:text-purple-200">Profile</span>
                                <span className="font-bold text-base text-purple-900 dark:text-purple-100">{userStats.profile_completion_percentage}%</span>
                            </div>
                        )}
                        {userStats && (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg px-4 py-2 border border-green-200 dark:border-green-800 text-xs flex flex-col items-center">
                                <span className="font-semibold text-green-700 dark:text-green-200">Websites</span>
                                <span className="font-bold text-base text-green-900 dark:text-green-100">{userStats.websites_count}</span>
                            </div>
                        )}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg px-4 py-2 border border-blue-200 dark:border-blue-800 text-xs flex flex-col items-center">
                            <span className="font-semibold text-blue-700 dark:text-blue-200">Data Points</span>
                            <span className="font-bold text-base text-blue-900 dark:text-blue-100">{learnedDataCount}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 md:gap-3 items-center mt-4 md:mt-0">
                        <button
                            onClick={handleRefreshData}
                            disabled={loading}
                            className="px-3 py-2 bg-blue-600 text-white border border-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                            title="Refresh data from server"
                        >
                            <span className="flex items-center gap-1">
                                <span>🔄</span>
                                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                            </span>
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-3 py-2 bg-emerald-600 text-white border border-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                        >
                            <span className="flex items-center gap-1">
                                <span>➕</span>
                                <span>Add</span>
                            </span>
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <button
                                onClick={exportDataForDebug}
                                className="px-2 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-400 dark:border-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-800 transition"
                                title="Export debug data"
                            >
                                <span>🐛</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Data List */}
                {autofillData && autofillData.length > 0 ? (
                    <div className="space-y-4">
                        {filteredWebsites.map(domain => (
                            <div key={domain} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setSelectedWebsite(selectedWebsite === domain ? null : domain)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                                            {domain.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">{domain}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{groupedData[domain].length} data point{groupedData[domain].length !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">{groupedData[domain].length}</span>
                                        <span className="text-gray-400 text-lg">{selectedWebsite === domain ? '▼' : '▶'}</span>
                                    </div>
                                </button>
                                {selectedWebsite === domain && (
                                    <div className="border-t border-gray-100 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/10 text-gray-900 dark:text-gray-100 p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {groupedData[domain].map((entry, index) => {
                                                let selector, value, type;
                                                if (entry.selector && entry.value !== undefined) {
                                                    selector = entry.selector;
                                                    value = entry.value;
                                                    type = entry.type || 'input';
                                                } else {
                                                    selector = Object.keys(entry).find(k => k !== "type" && k !== "file_name" && k !== "file_type" && k !== "pixels" && k !== "size");
                                                    value = entry[selector];
                                                    type = entry.type || 'input';
                                                }
                                                if (!selector) return null;
                                                return (
                                                    <div key={index} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">{formatLabel(selector)}</h4>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-0.5 rounded">{type}</span>
                                                                    <span>•</span>
                                                                    <span>{domain}</span>
                                                                    {entry.timestamp && (
                                                                        <><span>•</span><span>{new Date(entry.timestamp).toLocaleDateString()}</span></>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {value && value !== 'No data available' && value !== 'NA' && (
                                                                    <button
                                                                        onClick={() => copyToClipboard(value, formatLabel(selector))}
                                                                        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 border border-blue-700 text-xs font-semibold transition"
                                                                    >
                                                                        📋
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleRemove(selector, index)}
                                                                    className="p-1 bg-white dark:bg-gray-900 text-red-600 border border-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 text-xs transition"
                                                                    title="Remove this data"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="text-gray-900 dark:text-gray-100 text-sm">
                                                            {!value || value === 'No data available' || value === 'NA' ? (
                                                                <div className="flex items-center gap-2 text-gray-400 italic">
                                                                    <span>⚠️</span>
                                                                    <span>No data available</span>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 border border-gray-100 dark:border-gray-700 break-all text-xs leading-relaxed">
                                                                    {value}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {(entry.file_name || entry.file_type || entry.pixels || entry.size) && (
                                                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                    {entry.file_name && (<div>File: {entry.file_name}</div>)}
                                                                    {entry.file_type && (<div>Type: {entry.file_type}</div>)}
                                                                    {entry.pixels && (<div>Size: {entry.pixels}</div>)}
                                                                    {entry.size && (<div>Target: {entry.size}KB</div>)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    renderEmptyState()
                )}

                {/* Status Messages */}
                {status && (
                    <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fadeIn text-xs flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>{status}</span>
                    </div>
                )}

                {/* Add Data Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <span className="text-xl">➕</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Custom Data</h3>
                                <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">Add a new data point to your collection</p>
                            </div>
                            <form onSubmit={handleAddCustomData} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Field Selector</label>
                                    <input
                                        type="text"
                                        value={newData.selector}
                                        onChange={(e) => setNewData({...newData, selector: e.target.value})}
                                        placeholder="e.g., #email, [name='username']"
                                        className="w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 border border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Value</label>
                                    <input
                                        type="text"
                                        value={newData.value}
                                        onChange={(e) => setNewData({...newData, value: e.target.value})}
                                        placeholder="Enter the value"
                                        className="w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 border border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Type</label>
                                    <select
                                        value={newData.type}
                                        onChange={(e) => setNewData({...newData, type: e.target.value})}
                                        className="w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 border border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 text-xs"
                                    >
                                        <option value="text">Text</option>
                                        <option value="email">Email</option>
                                        <option value="tel">Phone</option>
                                        <option value="url">URL</option>
                                        <option value="number">Number</option>
                                        <option value="date">Date</option>
                                        <option value="textarea">Textarea</option>
                                        <option value="select">Select</option>
                                        <option value="checkbox">Checkbox</option>
                                        <option value="radio">Radio</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 border border-blue-700 text-xs font-semibold disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <span className="flex items-center justify-center gap-1">
                                                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                Saving...
                                            </span>
                                        ) : (
                                            'Save Data'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            {/* Footer */}
            
        </div>
    );
};

export default YourDetails; 