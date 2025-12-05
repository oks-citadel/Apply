import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { sendToContentScript } from '@shared/messaging';
import { MessageType, DetectedJob } from '@shared/types';

const QuickApply: React.FC = () => {
  const [detectedJob, setDetectedJob] = useState<DetectedJob | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    detectJobOnPage();
  }, []);

  const detectJobOnPage = async () => {
    try {
      const job = await sendToContentScript<void, DetectedJob>(
        MessageType.DETECT_JOB
      );
      setDetectedJob(job);
    } catch (error) {
      console.log('No job detected on current page');
    }
  };

  const handleQuickApply = async () => {
    if (!detectedJob) return;

    setIsApplying(true);
    setStatus('idle');

    try {
      await sendToContentScript(MessageType.START_APPLICATION);
      setStatus('success');
    } catch (error) {
      setStatus('error');
    } finally {
      setIsApplying(false);
    }
  };

  if (!detectedJob) {
    return (
      <div className="card bg-gray-50">
        <div className="text-center py-3">
          <p className="text-sm text-gray-500">
            Navigate to a job posting to use Quick Apply
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-primary-200 bg-primary-50">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="text-white" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Job Detected
          </h3>
          <p className="text-xs font-medium text-gray-700 truncate">
            {detectedJob.title}
          </p>
          <p className="text-xs text-gray-600">{detectedJob.company}</p>
        </div>
      </div>

      <button
        onClick={handleQuickApply}
        disabled={isApplying || status === 'success'}
        className="btn btn-primary w-full mt-3"
      >
        {isApplying ? (
          <>
            <Loader className="spinner mr-2" size={16} />
            Applying...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="mr-2" size={16} />
            Applied Successfully
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="mr-2" size={16} />
            Failed - Try Again
          </>
        ) : (
          <>
            <Zap className="mr-2" size={16} />
            Quick Apply
          </>
        )}
      </button>
    </div>
  );
};

export default QuickApply;
