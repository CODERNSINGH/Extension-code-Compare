import React, { useEffect } from 'react';

const ToastNotification = ({ message, visible, onClick, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl cursor-pointer flex items-center gap-3 animate-fadeIn"
      style={{ minWidth: 220, maxWidth: 350 }}
      onClick={onClick}
      role="alert"
      tabIndex={0}
    >
      <span className="text-xl">🔔</span>
      <span className="font-medium flex-1">{message}</span>
      <button
        onClick={e => { e.stopPropagation(); onClose && onClose(); }}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default ToastNotification; 