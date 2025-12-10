'use client';

import * as React from 'react';
import type { AutofillField } from '@/types/autofill';

interface QuickReviewPanelProps {
  fields: AutofillField[];
  onFieldUpdate: (fieldId: string, value: string) => void;
  onFieldAccept: (fieldId: string) => void;
  onFieldOverride: (fieldId: string, value: string) => void;
  onResolveConflict: (fieldId: string, selectedValue: string) => void;
  className?: string;
}

export function QuickReviewPanel({
  fields,
  onFieldUpdate,
  onFieldAccept,
  onResolveConflict,
  className = '',
}: QuickReviewPanelProps) {
  const [editingField, setEditingField] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState<string>('');

  const lowConfidenceFields = fields.filter((f) => f.confidence < 70);
  const missingFields = fields.filter((f) => f.required && !f.value);
  const conflictingFields = fields.filter((f) => f.isConflict);

  const handleEdit = (field: AutofillField) => {
    setEditingField(field.id);
    setEditValue(field.value);
  };

  const handleSaveEdit = (fieldId: string) => {
    onFieldUpdate(fieldId, editValue);
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">High: {confidence}%</span>;
    } else if (confidence >= 70) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Medium: {confidence}%</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Low: {confidence}%</span>;
    }
  };

  const getSourceBadge = (source: string) => {
    const sourceLabels: Record<string, string> = {
      resume: 'Resume',
      profile: 'Profile',
      saved_answer: 'Saved',
      ai_generated: 'AI',
      manual: 'Manual',
    };
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{sourceLabels[source] || source}</span>;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Missing Required Fields */}
      {missingFields.length > 0 && (
        <div className="border border-red-300 rounded-lg p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900">Missing Required Fields ({missingFields.length})</h3>
          </div>
          <div className="space-y-3">
            {missingFields.map((field) => (
              <div key={field.id} className="p-3 bg-white rounded-lg border border-red-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-red-900">{field.fieldName}</p>
                    <p className="text-xs text-red-700 mt-1">This field is required and must be filled</p>
                  </div>
                  <button
                    onClick={() => handleEdit(field)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Fill
                  </button>
                </div>
                {editingField === field.id && (
                  <div className="mt-3 space-y-2">
                    <input
                      type={field.fieldType}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder={`Enter ${field.fieldName}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(field.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflicting Data */}
      {conflictingFields.length > 0 && (
        <div className="border border-yellow-300 rounded-lg p-4 bg-yellow-50">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-yellow-900">Conflicting Data ({conflictingFields.length})</h3>
          </div>
          <div className="space-y-3">
            {conflictingFields.map((field) => (
              <div key={field.id} className="p-3 bg-white rounded-lg border border-yellow-200 space-y-3">
                <div>
                  <p className="font-medium text-sm text-yellow-900 mb-2">{field.fieldName}</p>
                  <p className="text-xs text-yellow-700">Multiple values found. Select the correct one:</p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2 bg-gray-50 rounded border cursor-pointer hover:border-blue-400">
                    <input
                      type="radio"
                      name={`conflict-${field.id}`}
                      defaultChecked
                      onChange={() => onResolveConflict(field.id, field.value)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{field.value}</p>
                      <div className="flex gap-2 mt-1">
                        {getSourceBadge(field.source)}
                        {getConfidenceBadge(field.confidence)}
                      </div>
                    </div>
                  </label>

                  {field.conflictingValues?.map((conflict, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded border cursor-pointer hover:border-blue-400"
                    >
                      <input
                        type="radio"
                        name={`conflict-${field.id}`}
                        onChange={() => onResolveConflict(field.id, conflict.value)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{conflict.value}</p>
                        <div className="flex gap-2 mt-1">
                          {getSourceBadge(conflict.source)}
                          {getConfidenceBadge(conflict.confidence)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Confidence Fields */}
      {lowConfidenceFields.length > 0 && (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold">Low Confidence Fields ({lowConfidenceFields.length})</h3>
          </div>
          <div className="space-y-3">
            {lowConfidenceFields.map((field) => (
              <div key={field.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{field.fieldName}</p>
                      {getConfidenceBadge(field.confidence)}
                      {getSourceBadge(field.source)}
                    </div>
                    {field.resumeVersion && (
                      <p className="text-xs text-gray-500">From: {field.resumeVersion}</p>
                    )}
                  </div>
                </div>

                {editingField === field.id ? (
                  <div className="space-y-2">
                    <input
                      type={field.fieldType}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder={field.fieldName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(field.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm flex-1 p-2 bg-white rounded border border-gray-200">
                      {field.value || <span className="text-gray-400">No value</span>}
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(field)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onFieldAccept(field.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                )}

                {field.validationErrors && field.validationErrors.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                    {field.validationErrors.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Good Message */}
      {missingFields.length === 0 && conflictingFields.length === 0 && lowConfidenceFields.length === 0 && (
        <div className="border border-green-300 rounded-lg p-6 bg-green-50">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium text-green-900">All fields look good!</p>
              <p className="text-sm text-green-700">No issues detected. Ready to submit.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickReviewPanel;
