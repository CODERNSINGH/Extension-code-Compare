import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from './Loader';
import Footer from './Footer';
import { 
    Database, 
    Search, 
    Trash2, 
    AlertCircle, 
    Layers,
    Globe,
    Settings,
    PlusCircle,
    ChevronDown,
    ChevronUp,
    X,
    Save,
    User,
    RefreshCw,
    Bug
} from 'lucide-react';

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
        <div className="text-center py-8 animate-fadeIn">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
                No Learned Data Yet
            </h3>
            <p className="text-gray-600 mb-4 max-w-sm mx-auto text-sm leading-relaxed">
                Start using the AutoFill feature on forms to build your personal data library. 
                Your information will appear here for easy access and management.
            </p>
            <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 text-sm"
            >
                Go to Dashboard
            </button>
        </div>
    );

    if (loading) {
        return <Loader message="Loading your learned data..." />;
    }

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 w-full mx-auto px-3 pt-20 pb-3 space-y-3 overflow-y-auto">
                {/* Enhanced Header */}
                <div className="text-center mb-3 animate-fadeIn">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Database className="w-5 h-5 text-blue-600" />
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Your Data</h1>
                    </div>
                    <p className="text-xs text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        View and manage form data learned from your interactions.
                    </p>
                </div>

                {/* Search and Stats */}
                <div className="flex flex-col gap-2 mb-3 items-center">
                    <div className="w-full">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search websites..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white text-gray-900 rounded-lg px-8 py-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition placeholder-gray-500 text-xs shadow-sm"
                            />
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <Search className="w-3 h-3" />
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center w-full justify-between">
                        <div className="flex gap-1">
                            {userStats && (
                                <div className="bg-purple-50 rounded px-2 py-1 border border-purple-200 text-xs flex flex-col items-center">
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3 text-purple-700" />
                                        <span className="font-semibold text-purple-700 text-xs">Profile</span>
                                    </div>
                                    <span className="font-bold text-sm text-purple-900">{userStats.profile_completion_percentage}%</span>
                                </div>
                            )}
                            {userStats && (
                                <div className="bg-green-50 rounded px-2 py-1 border border-green-200 text-xs flex flex-col items-center">
                                    <div className="flex items-center gap-1">
                                        <Globe className="w-3 h-3 text-green-700" />
                                        <span className="font-semibold text-green-700 text-xs">Sites</span>
                                    </div>
                                    <span className="font-bold text-sm text-green-900">{userStats.websites_count}</span>
                                </div>
                            )}
                            <div className="bg-blue-50 rounded px-2 py-1 border border-blue-200 text-xs flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                    <Database className="w-3 h-3 text-blue-700" />
                                    <span className="font-semibold text-blue-700 text-xs">Data</span>
                                </div>
                                <span className="font-bold text-sm text-blue-900">{learnedDataCount}</span>
                            </div>
                        </div>
                        <div className="flex gap-1 items-center">
                            <button
                                onClick={handleRefreshData}
                                disabled={loading}
                                className="px-2 py-1 bg-blue-600 text-white border border-blue-700 rounded text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                                title="Refresh data from server"
                            >
                                <span className="flex items-center gap-1">
                                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
                                </span>
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-2 py-1 bg-emerald-600 text-white border border-emerald-700 rounded text-xs font-semibold hover:bg-emerald-700 transition"
                            >
                                <span className="flex items-center gap-1">
                                    <PlusCircle className="w-3 h-3" />
                                    <span className="hidden sm:inline">Add</span>
                                </span>
                            </button>
                            {process.env.NODE_ENV === 'development' && (
                                <button
                                    onClick={exportDataForDebug}
                                    className="px-1 py-1 bg-gray-200 text-gray-700 border border-gray-400 rounded text-xs font-semibold hover:bg-gray-300 transition"
                                    title="Export debug data"
                                >
                                    <Bug className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data List */}
                {autofillData && autofillData.length > 0 ? (
                    <div className="space-y-2">
                        {filteredWebsites.map(domain => (
                            <div key={domain} className="rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setSelectedWebsite(selectedWebsite === domain ? null : domain)}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 transition group"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-xs">
                                            {domain.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-sm text-gray-900">{domain}</h3>
                                            <p className="text-xs text-gray-500">{groupedData[domain].length} data point{groupedData[domain].length !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="px-1 py-0.5 bg-blue-600 text-white rounded text-xs font-medium">{groupedData[domain].length}</span>
                                        <span className="text-gray-400 text-sm">{selectedWebsite === domain ? '▼' : '▶'}</span>
                                    </div>
                                </button>
                                {selectedWebsite === domain && (
                                    <div className="border-t border-gray-100 bg-blue-50/50 text-gray-900 p-3">
                                        <div className="grid grid-cols-1 gap-2">
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
                                                    <div key={index} className="bg-white border border-gray-100 rounded p-3 flex flex-col gap-1 shadow-sm">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-bold text-gray-900 text-sm mb-1 truncate">{formatLabel(selector)}</h4>
                                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <span className="bg-gray-100 text-gray-900 px-1 py-0.5 rounded text-xs">{type}</span>
                                                                    <span>•</span>
                                                                    <span className="truncate">{domain}</span>
                                                                    {entry.timestamp && (
                                                                        <><span>•</span><span>{new Date(entry.timestamp).toLocaleDateString()}</span></>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 ml-2">
                                                                {value && value !== 'No data available' && value !== 'NA' && (
                                                                    <button
                                                                        onClick={() => copyToClipboard(value, formatLabel(selector))}
                                                                        className="px-1 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 border border-blue-700 text-xs font-semibold transition"
                                                                    >
                                                                        📋
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleRemove(selector, index)}
                                                                    className="p-1 bg-white text-red-600 border border-red-400 rounded hover:bg-red-100 hover:text-red-700 text-xs transition"
                                                                    title="Remove this data"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="text-gray-900 text-xs">
                                                            {!value || value === 'No data available' || value === 'NA' ? (
                                                                <div className="flex items-center gap-1 text-gray-400 italic">
                                                                    <span>⚠️</span>
                                                                    <span>No data available</span>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-gray-50 rounded p-2 border border-gray-100 break-all text-xs leading-relaxed">
                                                                    {value}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {(entry.file_name || entry.file_type || entry.pixels || entry.size) && (
                                                            <div className="mt-1 pt-1 border-t border-gray-100">
                                                                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
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
                    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded shadow-lg z-50 animate-fadeIn text-xs flex items-center gap-1">
                        <span>ℹ️</span>
                        <span>{status}</span>
                    </div>
                )}

                {/* Add Data Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
                        <div className="bg-white text-gray-900 rounded-lg p-4 w-full max-w-sm shadow-2xl animate-fadeIn">
                            <div className="text-center mb-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center mx-auto mb-2">
                                    <span className="text-sm">➕</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900">Add Custom Data</h3>
                                <p className="text-gray-600 mt-1 text-xs">Add a new data point to your collection</p>
                            </div>
                            <form onSubmit={handleAddCustomData} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-900 mb-1">Field Selector</label>
                                    <input
                                        type="text"
                                        value={newData.selector}
                                        onChange={(e) => setNewData({...newData, selector: e.target.value})}
                                        placeholder="e.g., #email, [name='username']"
                                        className="w-full bg-gray-100 text-gray-900 rounded px-2 py-1.5 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-900 mb-1">Value</label>
                                    <input
                                        type="text"
                                        value={newData.value}
                                        onChange={(e) => setNewData({...newData, value: e.target.value})}
                                        placeholder="Enter the value"
                                        className="w-full bg-gray-100 text-gray-900 rounded px-2 py-1.5 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-900 mb-1">Type</label>
                                    <select
                                        value={newData.type}
                                        onChange={(e) => setNewData({...newData, type: e.target.value})}
                                        className="w-full bg-gray-100 text-gray-900 rounded px-2 py-1.5 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-xs"
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
                                        className="flex-1 px-2 py-1.5 border border-gray-400 text-gray-900 rounded hover:bg-gray-100 text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 border border-blue-700 text-xs font-semibold disabled:opacity-50"
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
            <Footer />
        </div>
    );
};

export default YourDetails; 