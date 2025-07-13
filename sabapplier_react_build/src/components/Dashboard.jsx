import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import EmailLogin from '../services/API/EmailLogin';
import Loader from './Loader';

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [unfilledData, setUnfilledData] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAutoFill = async () => {
    setLoading(true);
    setStatus('Filling form data...');
    setShowSuccess(false);

    try {
      const response = await EmailLogin(user.email, (msg) => setStatus(msg));

      if (response && response.fillResults) {
        const { notFilled, filled } = response.fillResults;
        
        // Store autofilled data locally for change detection
        if (filled && filled.length > 0) {
          await chrome.runtime.sendMessage({ 
            action: 'storeAutofilledData', 
            data: filled,
            url: window.location.href,
            title: document.title
          });
        }
        
        // Store unfilled data for DataPreview
        if (notFilled && notFilled.length > 0) {
          await chrome.runtime.sendMessage({ 
            action: 'storeUnfilledData', 
            data: notFilled,
            url: window.location.href,
            title: document.title
          });
          setUnfilledData(notFilled);
          setStatus(`${notFilled.length} fields could not be filled automatically`);
        } else {
          setStatus('All fields filled successfully!');
          setShowSuccess(true);
          setUnfilledData([]);
        }
      } else {
        setStatus('Form Data Filled Successfully');
      }
    } catch (err) {
      setStatus('Failed to fill form: ' + err.message);
    }

    setTimeout(() => setLoading(false), 3000);
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setStatus(`${fieldName} copied to clipboard!`);
      setTimeout(() => setStatus(''), 2000);
    });
  };

  const formatLabel = (selector) => {
    try {
      let label = selector.replace(/\[name=['"]|['"]\]/g, '').replace(/_/g, ' ').replace(/-/g, ' ').replace(/#/g, '');
      return label.replace(/\b\w/g, l => l.toUpperCase());
    } catch (e) {
      return selector;
    }
  };

  const isFileUrl = (value) => {
    return value && (value.startsWith('http') || value.startsWith('data:'));
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = () => {
    if (showSuccess) return '✅';
    if (loading) return '⏳';
    if (status.includes('failed') || status.includes('error')) return '❌';
    if (status.includes('could not be filled')) return '⚠️';
    return 'ℹ️';
  };

  return (
    <div className="min-h-full space-y-8">
      {/* Hero Section with Enhanced Design */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 rounded-3xl"></div>
        <div className="relative p-8 md:p-12 text-center">
          <div className="mb-10">
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 animate-fadeIn">
              Welcome back, {user.name}! 👋
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed animate-fadeIn">
              Ready to automate your form filling? Click the button below to instantly populate forms with your saved data.
            </p>
          </div>
        </div>
      </div>


      {/* Enhanced AutoFill Button */}
      <div className="text-center mb-12">
        <div className="relative">
          <button
            onClick={handleAutoFill}
            disabled={loading}
            className="group relative px-16 py-8 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white font-bold text-2xl rounded-3xl transition-all duration-500 shadow-2xl hover:shadow-3xl disabled:shadow-none transform hover:scale-105 disabled:transform-none overflow-hidden"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {loading ? (
              <div className="relative flex items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Filling Forms...</span>
              </div>
            ) : (
              <div className="relative flex items-center justify-center gap-4">
                <span className="text-3xl">🚀</span>
                <span>AutoFill Form</span>
              </div>
            )}
          </button>
          
          {/* Floating particles effect */}
          {!loading && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-8 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
              <div className="absolute top-8 right-12 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300"></div>
              <div className="absolute bottom-6 left-16 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-700"></div>
            </div>
          )}
        </div>
        
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">
          Click to automatically fill any form on this page with your saved information
        </p>
      </div>

      {/* Enhanced Status Messages */}
      {status && (
        <div className={`mx-auto max-w-2xl p-6 rounded-2xl border-2 shadow-lg animate-fadeIn ${
          showSuccess 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : status.includes('failed') || status.includes('error')
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : status.includes('could not be filled')
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">{getStatusIcon()}</span>
            <p className={`text-lg font-medium ${
              showSuccess 
                ? 'text-green-800 dark:text-green-200' 
                : status.includes('failed') || status.includes('error')
                ? 'text-red-800 dark:text-red-200'
                : status.includes('could not be filled')
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-blue-800 dark:text-blue-200'
            }`}>
              {status}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Unfilled Data Section */}
      {unfilledData.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Manual Fields Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Some fields couldn't be filled automatically. Copy the values below and fill them manually.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {unfilledData.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 card-hover animate-fadeIn">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                      {formatLabel(item.selector)}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">{item.type}</span>
                      <span>•</span>
                      <span>{item.reason || 'Could not be filled'}</span>
                    </div>
                  </div>
                  {item.value && item.value !== 'NA' && item.value !== 'NA' && item.value !== 'No data available' && (
                    <button
                      onClick={() => copyToClipboard(item.value, formatLabel(item.selector))}
                      className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 hover:scale-105"
                    >
                      <span>📋</span>
                      Copy
                    </button>
                  )}
                </div>
                
                <div className="text-gray-700 dark:text-gray-300">
                  {!item.value || item.value === 'No data available' ? (
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 italic">
                      <span>⚠️</span>
                      <span>No data available</span>
                    </div>
                  ) : isFileUrl(item.value) ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📎</span>
                        <span className="text-sm">File attachment</span>
                      </div>
                      <button
                        onClick={() => window.open(item.value, '_blank')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-all duration-200 font-semibold hover:scale-105"
                      >
                        Download
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 break-all text-sm leading-relaxed">
                      {item.value}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {loading && <Loader message={status || user.name || user.email} />}
    </div>
  );
}