import React, { useState, useRef, useEffect } from 'react';

export default function AccountDropdown({ users = [], onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Filter users based on search term
  const filteredUsers = users.filter(([email, data]) => {
    const name = data && data.name ? data.name : '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email && email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredUsers[highlightedIndex]) {
          handleUserSelect(filteredUsers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleUserSelect = ([email, data]) => {
    setSelectedUser({ email, data });
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    onSelect(email,data);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    if (!name || typeof name !== 'string') name = '?';
    const colors = [
      'linear-gradient(135deg, #8B5CF6, #EC4899)',
      'linear-gradient(135deg, #3B82F6, #06B6D4)',
      'linear-gradient(135deg, #10B981, #14B8A6)',
      'linear-gradient(135deg, #F59E0B, #F97316)',
      'linear-gradient(135deg, #EF4444, #EC4899)',
      'linear-gradient(135deg, #6366F1, #8B5CF6)'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="w-full max-w-sm mx-auto mb-6 dropdown-container" ref={dropdownRef}>
      {/* Enhanced Label */}
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 tracking-wide">
        Continue As
      </label>
      
      {/* Enhanced Main Dropdown Button */}
      <div className="relative dropdown-wrapper">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && searchRef.current) {
              setTimeout(() => searchRef.current?.focus(), 100);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
            isOpen 
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-xl shadow-blue-500/10' 
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-lg'
          } dropdown-button`}
        >
          <div className="flex items-center gap-4 dropdown-button-content">
            <div className="flex items-center gap-4 dropdown-button-left">
              {selectedUser ? (
                <>
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg user-avatar ring-2 ring-white dark:ring-gray-800"
                    style={{ background: getAvatarColor(selectedUser.data.name) }}
                  >
                    {getInitials(selectedUser.data.name)}
                  </div>
                  <div className="flex flex-col min-w-0 user-info">
                    <div className="font-bold text-gray-900 dark:text-gray-100 text-base truncate user-name">
                      {selectedUser.data.name}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm truncate user-email">
                      {selectedUser.email}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center default-avatar shadow-lg">
                    <svg className="w-6 h-6 text-gray-500 dark:text-gray-400 default-avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-gray-400 font-semibold text-base placeholder-text">
                    Select an account
                  </span>
                </>
              )}
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 dropdown-arrow ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {/* Enhanced Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 animate-fadeIn dropdown-menu backdrop-blur-sm">
            {/* Enhanced Search Input */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 search-container">
              <div className="relative search-wrapper">
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 search-input font-medium"
                />
              </div>
            </div>
            
            {/* Enhanced User Options */}
            <div className="max-h-72 overflow-y-auto options-container">
              {filteredUsers.length > 0 ? (
                <div className="flex flex-col p-2 options-list">
                  {filteredUsers.map(([email, data], index) => {
                    const name = data && data.name ? data.name : email;
                    return (
                      <button
                        key={email}
                        onClick={() => handleUserSelect([email, data])}
                        className={`flex items-center gap-4 w-full px-4 py-4 text-left rounded-xl transition-all duration-200 option-item ${
                          index === highlightedIndex 
                            ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        } ${selectedUser?.email === email ? 'bg-blue-100 dark:bg-blue-800/50 border border-blue-300 dark:border-blue-600' : ''}`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        {/* Enhanced Avatar */}
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg option-avatar ring-2 ring-white dark:ring-gray-800"
                          style={{ background: getAvatarColor(name) }}
                        >
                          {getInitials(name)}
                        </div>
                        
                        {/* Enhanced User Info */}
                        <div className="flex flex-col min-w-0 flex-1 option-info">
                          <div className="font-bold text-gray-900 dark:text-gray-100 text-base truncate option-name">
                            {name}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-sm truncate option-email">
                            {email}
                          </div>
                        </div>
                        
                        {/* Enhanced Selected Indicator */}
                        {selectedUser?.email === email && (
                          <div className="ml-auto selected-indicator">
                            <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white check-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 empty-state">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400 empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-gray-400 mb-2 empty-title">
                    No accounts found
                  </p>
                  <p className="text-sm text-gray-300 empty-subtitle">
                    Try adjusting your search terms
                  </p>
                </div>
              )}
            </div>
            
            {/* Enhanced Footer */}
            {filteredUsers.length > 0 && (
              <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 text-center dropdown-footer rounded-b-2xl">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 footer-text">
                  {filteredUsers.length} account{filteredUsers.length !== 1 ? 's' : ''} available
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}