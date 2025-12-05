'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { Experience } from '@/types/resume';

interface WorkExperienceFormProps {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
  isLoading?: boolean;
}

export function WorkExperienceForm({ experiences, onChange, isLoading }: WorkExperienceFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Experience>>({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    highlights: [],
  });

  const resetForm = () => {
    setFormData({
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      highlights: [],
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    resetForm();
  };

  const handleEdit = (experience: Experience) => {
    setEditingId(experience.id);
    setFormData({ ...experience });
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.company || !formData.position || !formData.startDate) {
      return;
    }

    // Parse highlights from description if it contains bullet points
    const highlights = formData.description
      ? formData.description
          .split('\n')
          .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'))
          .map((line) => line.replace(/^[-•]\s*/, '').trim())
          .filter(Boolean)
      : [];

    const experienceData: Experience = {
      id: editingId || `exp_${Date.now()}`,
      company: formData.company || '',
      position: formData.position || '',
      location: formData.location,
      startDate: formData.startDate || '',
      endDate: formData.current ? undefined : formData.endDate,
      current: formData.current || false,
      description: formData.description || '',
      highlights,
    };

    if (editingId) {
      onChange(experiences.map((exp) => (exp.id === editingId ? experienceData : exp)));
    } else {
      onChange([...experiences, experienceData]);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this work experience?')) {
      onChange(experiences.filter((exp) => exp.id !== id));
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleCurrentChange = (checked: boolean) => {
    setFormData({ ...formData, current: checked, endDate: checked ? '' : formData.endDate });
  };

  return (
    <div className="space-y-4">
      {/* Existing Experiences */}
      {experiences.map((experience) => (
        <Card key={experience.id} className="p-4">
          {editingId === experience.id ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company Name"
                  required
                />
                <Input
                  label="Job Title"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Software Engineer"
                  required
                />
              </div>

              <Input
                label="Location (Optional)"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="month"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <Input
                  label="End Date"
                  type="month"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  disabled={formData.current}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="current-edit"
                  checked={formData.current}
                  onChange={(e) => handleCurrentChange(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="current-edit" className="text-sm font-medium">
                  I currently work here
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description & Responsibilities
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                  placeholder="- Led a team of 5 developers&#10;- Increased performance by 40%&#10;- Implemented new features using React"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use bullet points starting with - or • for better formatting
                </p>
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
                  <h4 className="font-semibold text-lg">{experience.position}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{experience.company}</p>
                  {experience.location && (
                    <p className="text-sm text-gray-500">{experience.location}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(experience.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {experience.current
                      ? 'Present'
                      : experience.endDate
                      ? new Date(experience.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Present'}
                  </p>
                  {experience.description && (
                    <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                      {experience.highlights.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {experience.highlights.map((highlight, idx) => (
                            <li key={idx}>{highlight}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="whitespace-pre-line">{experience.description}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(experience)}
                    disabled={isLoading}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(experience.id)}
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

      {/* Add New Experience Form */}
      {isAdding && (
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Add Work Experience</h4>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company Name"
                required
              />
              <Input
                label="Job Title"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Software Engineer"
                required
              />
            </div>

            <Input
              label="Location (Optional)"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="San Francisco, CA"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="month"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <Input
                label="End Date"
                type="month"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                disabled={formData.current}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="current-add"
                checked={formData.current}
                onChange={(e) => handleCurrentChange(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="current-add" className="text-sm font-medium">
                I currently work here
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description & Responsibilities
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                placeholder="- Led a team of 5 developers&#10;- Increased performance by 40%&#10;- Implemented new features using React"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use bullet points starting with - or • for better formatting
              </p>
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
          Add Work Experience
        </Button>
      )}

      {experiences.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 text-center py-4">
          No work experience added yet. Click the button above to add your first experience.
        </p>
      )}
    </div>
  );
}
