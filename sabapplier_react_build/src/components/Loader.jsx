import React from 'react';

export default function Loader({ message }) {
  const isError = message.toLowerCase().includes('failed') || message.toLowerCase().includes('error');
  const isSuccess = message.toLowerCase().includes('success') || message.toLowerCase().includes('successful');

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 text-center min-w-[280px] max-w-sm mx-4 animate-fadeIn">
        {isError ? (
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-red-500 animate-bounce-slow">❌</span>
          </div>
        ) : isSuccess ? (
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-green-500 animate-bounce-slow">✅</span>
          </div>
        ) : (
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className={`text-lg font-semibold mb-2 ${
          isError 
            ? 'text-red-600 dark:text-red-400' 
            : isSuccess 
            ? 'text-green-600 dark:text-green-400'
            : 'text-blue-600 dark:text-blue-400'
        }`}>
          {message}
        </div>
        
        {!isError && !isSuccess && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Please wait while we process your request...
          </div>
        )}
        
        {/* Animated dots for loading state */}
        {!isError && !isSuccess && (
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
