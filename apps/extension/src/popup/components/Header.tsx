import React from 'react';
import { useExtensionStore } from '../store';
import { Settings, User, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { auth, currentView, setCurrentView, logout } = useExtensionStore();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="/icons/icon48.png"
            alt="JobPilot"
            className="w-8 h-8"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900">JobPilot AI</h1>
            {auth.user && (
              <p className="text-xs text-gray-500">{auth.user.email}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`p-2 rounded-md transition-colors ${
              currentView === 'dashboard'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Dashboard"
          >
            <User size={18} />
          </button>

          <button
            onClick={() => setCurrentView('settings')}
            className={`p-2 rounded-md transition-colors ${
              currentView === 'settings'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Settings"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={logout}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
