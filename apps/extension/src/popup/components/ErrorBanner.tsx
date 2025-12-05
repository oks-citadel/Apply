import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => {
  return (
    <div className="bg-error-50 border-b border-error-200 px-4 py-3">
      <div className="flex items-start space-x-3">
        <AlertCircle className="text-error-600 flex-shrink-0 mt-0.5" size={18} />
        <p className="flex-1 text-sm text-error-700">{message}</p>
        <button
          onClick={onClose}
          className="text-error-600 hover:text-error-700 flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;
