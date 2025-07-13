import React from 'react';
import AccountDropdown from './AccountDropdown';

/**
 * DashboardAccountSwitcher - A styled wrapper for AccountDropdown specifically for the dashboard
 * 
 * @param {Object} props - Component props
 * @param {Array} props.users - Array of user data for the dropdown
 * @param {Function} props.onSelect - Callback when a user is selected
 * @returns {JSX.Element}
 */
const DashboardAccountSwitcher = ({ users, onSelect }) => {
  // Force display for debugging - remove this condition later
  const usersList = users || [];
  console.log('DashboardAccountSwitcher - users:', usersList);
  
  // For debugging: always show a message even if no users
  if (usersList.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto mt-6 animate-fadeIn bg-red-500/30 text-white p-4 rounded-xl text-center">
        <p>No saved accounts found to display in dropdown</p>
        <p className="text-xs mt-2">Add at least one more account to enable switching</p>
      </div>
    );
  }

  return (
    <div className="dashboard-account-switcher w-full max-w-md mx-auto mt-6 animate-fadeIn border-2 border-yellow-500">
      <div className="flex items-center justify-center gap-2 mb-2 bg-blue-900/50 p-2 rounded-lg">
        <svg className="w-5 h-5 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <p className="text-sm text-yellow-300 font-bold">
          Switch accounts or use different saved data ({usersList.length} accounts)
        </p>
      </div>
      
      <div className="bg-white/20 backdrop-blur-sm border border-white/40 p-4 rounded-xl">
        <AccountDropdown users={usersList} onSelect={onSelect} />
      </div>
    </div>
  );
};

export default DashboardAccountSwitcher;
