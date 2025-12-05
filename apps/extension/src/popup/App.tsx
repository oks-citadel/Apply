import React, { useEffect } from 'react';
import { useExtensionStore } from './store';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import ResumeSelector from './components/ResumeSelector';
import ErrorBanner from './components/ErrorBanner';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { currentView, auth, isLoading, error, checkAuth, setError } = useExtensionStore();

  useEffect(() => {
    // Check authentication on mount
    checkAuth();
  }, []);

  const renderContent = () => {
    if (!auth.isAuthenticated) {
      return <LoginForm />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'settings':
        return <Settings />;
      case 'resume-selector':
        return <ResumeSelector />;
      case 'login':
        return <LoginForm />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50">
      {auth.isAuthenticated && <Header />}

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <div className="animate-fade-in">{renderContent()}</div>
      )}
    </div>
  );
}

export default App;
