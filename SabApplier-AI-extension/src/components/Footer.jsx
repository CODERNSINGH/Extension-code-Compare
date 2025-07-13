import React from 'react';
import { ExternalLink, Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 px-3 py-2">
      <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
        <Shield className="w-3 h-3 text-gray-500" />
        <a
          href="https://sabapplier.com/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 transition-colors duration-200 flex items-center gap-1"
        >
          Privacy Policy
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500">© 2025 SabApplier</span>
      </div>
    </footer>
  );
};

export default Footer;
