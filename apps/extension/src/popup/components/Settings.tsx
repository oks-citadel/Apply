import React, { useEffect, useState } from 'react';
import { useExtensionStore } from '../store';
import { ChevronLeft, Save, Check } from 'lucide-react';
import { ExtensionSettings } from '@shared/types';

const Settings: React.FC = () => {
  const { settings, updateSettings, setCurrentView } = useExtensionStore();
  const [localSettings, setLocalSettings] = useState<ExtensionSettings | null>(
    settings
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof ExtensionSettings) => {
    if (!localSettings) return;

    setLocalSettings({
      ...localSettings,
      [key]: !localSettings[key],
    });
  };

  const handleAutofillToggle = (
    key: keyof ExtensionSettings['autofillPreferences']
  ) => {
    if (!localSettings) return;

    setLocalSettings({
      ...localSettings,
      autofillPreferences: {
        ...localSettings.autofillPreferences,
        [key]: !localSettings.autofillPreferences[key],
      },
    });
  };

  if (!localSettings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-[500px]">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || saved}
            className="btn btn-primary text-sm py-1.5 px-3"
          >
            {saved ? (
              <>
                <Check size={14} className="mr-1" />
                Saved
              </>
            ) : (
              <>
                <Save size={14} className="mr-1" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* General Settings */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            General
          </h3>
          <div className="space-y-3">
            <ToggleItem
              label="Auto-detect jobs"
              description="Automatically detect job postings on pages"
              checked={localSettings.autoDetectJobs}
              onChange={() => handleToggle('autoDetectJobs')}
            />

            <ToggleItem
              label="Auto-fill forms"
              description="Automatically fill application forms"
              checked={localSettings.autoFillForms}
              onChange={() => handleToggle('autoFillForms')}
            />

            <ToggleItem
              label="Show notifications"
              description="Display notifications for extension events"
              checked={localSettings.showNotifications}
              onChange={() => handleToggle('showNotifications')}
            />

            <ToggleItem
              label="Save jobs automatically"
              description="Automatically save detected jobs"
              checked={localSettings.saveJobsAutomatically}
              onChange={() => handleToggle('saveJobsAutomatically')}
            />
          </div>
        </section>

        {/* Autofill Preferences */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Autofill Preferences
          </h3>
          <div className="space-y-3">
            <ToggleItem
              label="Fill personal info"
              description="Name, email, phone, address"
              checked={localSettings.autofillPreferences.fillPersonalInfo}
              onChange={() => handleAutofillToggle('fillPersonalInfo')}
            />

            <ToggleItem
              label="Fill work experience"
              description="Previous jobs and responsibilities"
              checked={localSettings.autofillPreferences.fillWorkExperience}
              onChange={() => handleAutofillToggle('fillWorkExperience')}
            />

            <ToggleItem
              label="Fill education"
              description="Schools, degrees, and dates"
              checked={localSettings.autofillPreferences.fillEducation}
              onChange={() => handleAutofillToggle('fillEducation')}
            />

            <ToggleItem
              label="Fill skills"
              description="Technical and soft skills"
              checked={localSettings.autofillPreferences.fillSkills}
              onChange={() => handleAutofillToggle('fillSkills')}
            />

            <ToggleItem
              label="Highlight fields"
              description="Visual highlight for auto-filled fields"
              checked={localSettings.autofillPreferences.highlightFields}
              onChange={() => handleAutofillToggle('highlightFields')}
            />

            <ToggleItem
              label="Confirm before submit"
              description="Ask for confirmation before submitting"
              checked={localSettings.autofillPreferences.confirmBeforeSubmit}
              onChange={() => handleAutofillToggle('confirmBeforeSubmit')}
            />
          </div>
        </section>

        {/* About */}
        <section className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>JobPilot AI Extension v1.0.0</p>
            <p>
              <a
                href="https://jobpilot.ai/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700"
              >
                Privacy Policy
              </a>
              {' • '}
              <a
                href="https://jobpilot.ai/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700"
              >
                Terms of Service
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

interface ToggleItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

const ToggleItem: React.FC<ToggleItemProps> = ({
  label,
  description,
  checked,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 pr-3">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          checked ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default Settings;
