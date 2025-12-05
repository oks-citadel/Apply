'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { Education } from '@/types/resume';

interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
  isLoading?: boolean;
}

export function EducationForm({ education, onChange, isLoading }: EducationFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Education>>({
    institution: '',
    degree: '',
    field: '',
    location: '',
    startDate: '',
    endDate: '',
    gpa: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    resetForm();
  };

  const handleEdit = (edu: Education) => {
    setEditingId(edu.id);
    setFormData({ ...edu });
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.institution || !formData.degree || !formData.field || !formData.startDate) {
      return;
    }

    const educationData: Education = {
      id: editingId || `edu_${Date.now()}`,
      institution: formData.institution || '',
      degree: formData.degree || '',
      field: formData.field || '',
      location: formData.location,
      startDate: formData.startDate || '',
      endDate: formData.endDate,
      gpa: formData.gpa,
      description: formData.description,
    };

    if (editingId) {
      onChange(education.map((edu) => (edu.id === editingId ? educationData : edu)));
    } else {
      onChange([...education, educationData]);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this education entry?')) {
      onChange(education.filter((edu) => edu.id !== id));
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="space-y-4">
      {/* Existing Education */}
      {education.map((edu) => (
        <Card key={edu.id} className="p-4">
          {editingId === edu.id ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="School/University"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="University of California"
                  required
                />
                <Input
                  label="Degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="Bachelor of Science"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Field of Study"
                  value={formData.field}
                  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  placeholder="Computer Science"
                  required
                />
                <Input
                  label="Location (Optional)"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Berkeley, CA"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Start Date"
                  type="month"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <Input
                  label="End Date (Optional)"
                  type="month"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
                <Input
                  label="GPA (Optional)"
                  value={formData.gpa || ''}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                  placeholder="3.8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Activities & Achievements (Optional)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                  placeholder="Dean's List, President of Computer Science Club, etc."
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSave} size="sm" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{edu.institution}</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {edu.degree} in {edu.field}
                  </p>
                  {edu.location && <p className="text-sm text-gray-500">{edu.location}</p>}
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(edu.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {edu.endDate
                      ? new Date(edu.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Present'}
                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                  </p>
                  {edu.description && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {edu.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(edu)}
                    disabled={isLoading}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(edu.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}

      {/* Add New Education Form */}
      {isAdding && (
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Add Education</h4>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="School/University"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="University of California"
                required
              />
              <Input
                label="Degree"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                placeholder="Bachelor of Science"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Field of Study"
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                placeholder="Computer Science"
                required
              />
              <Input
                label="Location (Optional)"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Berkeley, CA"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Input
                label="Start Date"
                type="month"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <Input
                label="End Date (Optional)"
                type="month"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              <Input
                label="GPA (Optional)"
                value={formData.gpa || ''}
                onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                placeholder="3.8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Activities & Achievements (Optional)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                placeholder="Dean's List, President of Computer Science Club, etc."
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSave} size="sm" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Add Button */}
      {!isAdding && !editingId && (
        <Button onClick={handleAdd} variant="outline" className="w-full" disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      )}

      {education.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 text-center py-4">
          No education added yet. Click the button above to add your first education entry.
        </p>
      )}
    </div>
  );
}
