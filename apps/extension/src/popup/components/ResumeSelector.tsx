import React from 'react';
import { useExtensionStore } from '../store';
import { FileText, Check, ChevronLeft } from 'lucide-react';
import { formatDate } from '@shared/utils';

const ResumeSelector: React.FC = () => {
  const { resumes, activeResume, selectResume, setCurrentView } =
    useExtensionStore();

  const handleSelectResume = async (resumeId: string) => {
    await selectResume(resumeId);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-[500px]">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            Select Resume
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {resumes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-sm text-gray-600 mb-4">No resumes found</p>
            <a
              href="https://jobpilot.ai/resumes"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex"
            >
              Create Resume
            </a>
          </div>
        ) : (
          resumes.map((resume) => {
            const isActive = activeResume?.id === resume.id;

            return (
              <button
                key={resume.id}
                onClick={() => handleSelectResume(resume.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'bg-primary-600'
                        : 'bg-gray-100'
                    }`}
                  >
                    {isActive ? (
                      <Check className="text-white" size={20} />
                    ) : (
                      <FileText className="text-gray-600" size={20} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {resume.name}
                      </h3>
                      {resume.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mb-2">
                      {resume.personalInfo.fullName}
                    </p>

                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>{resume.experience.length} experiences</span>
                      <span>•</span>
                      <span>{resume.education.length} education</span>
                      <span>•</span>
                      <span>{resume.skills.length} skills</span>
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Updated {formatDate(resume.updatedAt)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ResumeSelector;
