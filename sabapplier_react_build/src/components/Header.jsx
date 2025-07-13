import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for openDataPreview message to navigate from anywhere
  useEffect(() => {
    if (!chrome?.runtime?.onMessage) return;
    const handler = (message, sender, sendResponse) => {
      if (message.action === 'openDataPreview' && location.pathname !== '/data-preview') {
        navigate('/data-preview');
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [navigate, location.pathname]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleProfile = () => {
    window.open('https://sabapplier.com/profile', '_blank');
    setShowProfileMenu(false);
  };

  const handleEdit = () => {
    window.open('https://sabapplier.com/auto-fill-data', '_blank');
    setShowProfileMenu(false);
  };

  const logout = () => {
    setShowProfileMenu(false);
    onLogout();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Main dashboard'
    },
    {
      path: '/your-details',
      label: 'New Data',
      icon: '📖',
      description: 'Check your data'
    },
    // {
    //   path: '/filled-details',
    //   label: 'Filled Data',
    //   icon: '✅',
    //   description: 'Recent fills'
    // },
    {
      path: '/data-preview',
      label: 'Preview',
      icon: '👁️',
      description: 'Data preview'
    }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-lg' 
        : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Left Side - Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <img src="/logos/logo-128.png" alt="SabApplier AI Logo" className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
            <div className="block">
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100">SabApplier AI</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Smart Form Automation</p>
            </div>
          </div>

          {/* Center - Navigation */}
          <nav className="hidden md:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group relative px-3 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  isActive(item.path)
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                title={item.description}
              >
                <span className="text-base transition-transform group-hover:scale-110">{item.icon}</span>
                <span className="hidden lg:block text-sm">{item.label}</span>
                
                {/* Active indicator */}
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </nav>

          {/* Right Side - User Profile */}
          <div className="flex items-center gap-2">
            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                title="User menu"
              >
                {getInitials(user.name)}
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-fadeIn">
                  {/* User Info in Menu */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-base">{getInitials(user.name)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleProfile}
                      className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-3 group"
                    >
                      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-base">👤</span>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Profile Settings</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Manage your account</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-3 group"
                    >
                      <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-base">⚙️</span>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Edit Data</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Update your information</p>
                      </div>
                    </button>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center gap-3 group"
                    >
                      <div className="w-7 h-7 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-base">🚪</span>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Logout</span>
                        <p className="text-xs text-red-500 dark:text-red-400">Sign out of your account</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-2">
          <nav className="flex items-center justify-around">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                title={item.description}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  );
};

export default Header; 