import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Eye, 
  User, 
  LogOut, 
  Settings, 
  Menu, 
  X, 
  ChevronDown 
} from 'lucide-react';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const profileRef = useRef(null);

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

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      description: 'Main dashboard'
    },
    {
      path: '/your-details',
      label: 'New Data',
      icon: <FileText size={18} />,
      description: 'Check your data'
    },
    {
      path: '/data-preview',
      label: 'Preview',
      icon: <Eye size={18} />,
      description: 'Data preview'
    }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 border-b border-blue-300/20 shadow-md transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left Side - Brand */}
          <div className="flex items-center gap-2 group transition-all duration-300 hover:scale-105">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden border border-blue-200/40 group-hover:border-blue-300/60 transition-all duration-300">
              <img src="/logos/logo-128.png" alt="SabApplier AI Logo" className="w-5 h-5" />
            </div>
            <div className="block">
              <h1 className="text-base font-bold text-white">SabApplier <span className="text-blue-300 font-extrabold">AI</span></h1>
              <p className="text-xs text-gray-300 hidden sm:block">Smart Form Automation</p>
            </div>
          </div>

          {/* Center - Navigation */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`font-medium transition-all duration-300 hover:scale-105 relative group flex items-center gap-1.5 px-2 py-1.5 rounded-md ${
                  isActive(item.path)
                    ? 'text-blue-300'
                    : 'text-white/90 hover:text-blue-300'
                }`}
                title={item.description}
              >
                <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
                
                {/* Active indicator */}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-blue-400 transition-all duration-300 ${
                  isActive(item.path) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </button>
            ))}
          </nav>

          {/* Right Side - User Profile */}
          <div className="relative flex items-center gap-2" ref={profileRef}>
            {/* User Profile Menu */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-2 py-1.5 text-white border border-blue-300/30 rounded-md font-medium text-xs transition-all duration-300 hover:bg-white/10 hover:border-blue-300/50 hover:shadow-sm backdrop-blur-sm"
              title="User menu"
            >
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border border-white/30">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="hidden sm:block">
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown 
                className="w-3 h-3 transition-transform duration-200" 
                style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            
            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-xl border border-blue-200/20 py-2 z-50 backdrop-blur-sm">
                {/* User Info in Menu */}
                <div className="px-3 py-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center border border-white/30">
                      <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'U'}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <a
                    href="https://sabapplier.com/profile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-3 py-1.5 text-left text-white/90 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 flex items-center gap-2 group"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="w-6 h-6 bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User className="w-3 h-3 text-blue-400" />
                    </div>
                    <div>
                      <span className="font-medium text-xs">Profile Settings</span>
                      <p className="text-xs text-gray-400">Manage your account</p>
                    </div>
                  </a>
                  
                  <a
                    href="https://sabapplier.com/auto-fill-data"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-3 py-1.5 text-left text-white/90 hover:bg-white/10 hover:text-blue-300 transition-all duration-200 flex items-center gap-2 group"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="w-6 h-6 bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Settings className="w-3 h-3 text-green-400" />
                    </div>
                    <div>
                      <span className="font-medium text-xs">Edit Data</span>
                      <p className="text-xs text-gray-400">Update your information</p>
                    </div>
                  </a>
                  
                  <div className="border-t border-white/10 my-1"></div>
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-1.5 text-left text-red-400 hover:bg-red-900/20 transition-all duration-200 flex items-center gap-2 group"
                  >
                    <div className="w-6 h-6 bg-red-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LogOut className="w-3 h-3 text-red-400" />
                    </div>
                    <div>
                      <span className="font-medium text-xs">Logout</span>
                      <p className="text-xs text-red-400">Sign out of your account</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-blue-300/10 py-1">
          <nav className="flex items-center justify-around">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-blue-300 bg-blue-900/30'
                    : 'text-white/90 hover:text-blue-300 hover:bg-blue-900/20'
                }`}
                title={item.description}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;