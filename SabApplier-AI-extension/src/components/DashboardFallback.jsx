import React from 'react';

const DashboardFallback = ({ user, onLogout }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg">
      <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
        <span className="text-blue-600 dark:text-blue-400 text-4xl">👋</span>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to SabApplier AI</h1>
      
      <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 text-center max-w-lg">
        Your JWT authentication is working perfectly! You're logged in as:
      </p>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-8 w-full max-w-md">
        <div className="mb-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">Name:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">{user?.name || 'Unknown'}</span>
        </div>
        <div className="mb-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">Email:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">{user?.email || 'Unknown'}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400 text-sm">ID:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">{user?.id || 'Unknown'}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
        <button
          onClick={() => chrome.tabs.create({ url: 'http://localhost:3000/dashboard' })}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          Open Dashboard
        </button>
        
        <button
          onClick={onLogout}
          className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-medium rounded-xl transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default DashboardFallback;
