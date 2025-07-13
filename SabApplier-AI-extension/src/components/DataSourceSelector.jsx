import React, { useState } from 'react';
import { ChevronDown, Database, User } from 'lucide-react';

/**
 * DataSourceSelector - A dropdown component for selecting data sources
 * Shows "My Own Data" and shared accounts options
 * 
 * @param {Object} props - Component props
 * @param {Array} props.users - Array of [email, data] tuples for shared accounts
 * @param {Object} props.currentUser - Current user object
 * @param {Object} props.currentDataSource - Currently selected data source
 * @param {Function} props.onSelect - Callback when a data source is selected
 * @returns {JSX.Element}
 */
const DataSourceSelector = ({ users, currentUser, currentDataSource, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  console.log('DataSourceSelector received users:', users);
  console.log('DataSourceSelector current user:', currentUser);
  console.log('DataSourceSelector current data source:', currentDataSource);
  
  // Filter to find shared accounts (accounts with type='shared' or with shareId)
  const sharedAccounts = users.filter(([email, data]) => {
    // Check if this is a shared account (not the current user's account)
    const isShared = data.type === 'shared' || data.shareId;
    const isDifferentUser = email !== currentUser?.email;
    return isShared && isDifferentUser;
  });
  
  console.log('Filtered shared accounts:', sharedAccounts);
  
  // Determine if we're currently using a shared account
  const isUsingSharedAccount = currentDataSource?.isShared === true || currentDataSource?.type === 'shared';
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleSelect = (email, data) => {
    setIsOpen(false);
    if (onSelect) {
      onSelect(email, data);
    }
  };
  
  const handleSelectOwnData = () => {
    setIsOpen(false);
    if (onSelect && currentUser?.email) {
      // Use the current user's own data
      onSelect(currentUser.email, {
        name: currentUser.name,
        type: 'self',
        isShared: false
      });
    }
  };
  
  return (
    <div className="data-source-selector w-full max-w-md mx-auto">
      <div className="border border-gray-200 rounded-lg shadow-sm">
        {/* Data Source Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <Database className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Data Source</span>
          </div>
        </div>
        
        {/* Current Selection */}
        <div 
          className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={toggleDropdown}
        >
          <div className="flex items-center">
            <User className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-gray-900">
              {isUsingSharedAccount 
                ? `${currentDataSource?.name || 'Shared Account'}'s Data` 
                : 'My Own Data'}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
        
        {/* Dropdown Options */}
        {isOpen && (
          <div className="absolute mt-1 w-full max-w-md bg-white border border-gray-200 rounded-md shadow-lg z-10">
            <div className="py-1">
              {/* My Own Data Option */}
              <div 
                className={`px-4 py-2 flex items-center hover:bg-gray-100 cursor-pointer ${!isUsingSharedAccount ? 'bg-blue-50' : ''}`}
                onClick={handleSelectOwnData}
              >
                <User className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-gray-900">My Own Data</span>
                {!isUsingSharedAccount && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Current</span>
                )}
              </div>
              
              {/* Shared Account Options */}
              {(sharedAccounts.length > 0 || users.some(([_, data]) => data.type === 'shared')) && (
                <div className="border-t border-gray-200 mt-1 pt-1">
                  <div className="px-4 py-1">
                    <span className="text-xs font-medium text-gray-500">Shared With Me</span>
                  </div>
                  
                  {users
                    .filter(([email, data]) => data.type === 'shared' || data.shareId)
                    .map(([email, data]) => (
                      <div 
                        key={email}
                        className={`px-4 py-2 flex items-center hover:bg-gray-100 cursor-pointer ${
                          isUsingSharedAccount && currentDataSource?.email === email ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelect(email, { ...data, type: 'shared' })}
                      >
                        <User className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-900">{data.name || email.split('@')[0]}'s Data</span>
                        {isUsingSharedAccount && currentDataSource?.email === email && (
                          <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Current</span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourceSelector;
