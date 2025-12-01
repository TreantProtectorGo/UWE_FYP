import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AppLayout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-800">
                {t('appName')}
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              {/* Navigation Links */}
              <Link 
                to="/" 
                className={`text-sm font-medium transition ${
                  isActive('/') ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {t('trafficNews.title')}
              </Link>
              <Link 
                to="/special-traffic" 
                className={`text-sm font-medium transition ${
                  isActive('/special-traffic') ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {i18n.language === 'zh' ? '特別交通安排' : 'Special Traffic'}
              </Link>
              <Link 
                to="/road-closure" 
                className={`text-sm font-medium transition ${
                  isActive('/road-closure') ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {i18n.language === 'zh' ? '封路安排' : 'Road Closure'}
              </Link>
              
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {i18n.language === 'zh' ? 'EN' : '中文'}
                </span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2025 {t('appName')}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
