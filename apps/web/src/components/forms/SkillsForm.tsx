'use client';

import { useState } from 'react';
import { Plus, Trash2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import type { Skill } from '@/types/resume';

interface SkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
  isLoading?: boolean;
  onAISuggest?: () => void;
}

const SKILL_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'soft', label: 'Soft Skills' },
  { value: 'language', label: 'Language' },
  { value: 'tool', label: 'Tool/Software' },
  { value: 'other', label: 'Other' },
] as const;

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
] as const;

// Common skill suggestions by category
const SKILL_SUGGESTIONS: Record<string, string[]> = {
  technical: [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'React',
    'Node.js',
    'SQL',
    'AWS',
    'Docker',
    'Kubernetes',
  ],
  soft: [
    'Communication',
    'Leadership',
    'Problem Solving',
    'Teamwork',
    'Time Management',
    'Adaptability',
    'Critical Thinking',
    'Creativity',
  ],
  tool: [
    'Git',
    'Jira',
    'Figma',
    'Adobe Creative Suite',
    'Microsoft Office',
    'Slack',
    'VS Code',
    'Postman',
  ],
  language: ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Arabic'],
};

export function SkillsForm({ skills, onChange, isLoading, onAISuggest }: SkillsFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState<Partial<Skill>>({
    name: '',
    category: 'technical',
    level: 'intermediate',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'technical',
      level: 'intermediate',
    });
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setShowSuggestions(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.category) {
      return;
    }

    const skillData: Skill = {
      id: `skill_${Date.now()}`,
      name: formData.name || '',
      category: (formData.category as Skill['category']) || 'technical',
      level: formData.level as Skill['level'],
    };

    onChange([...skills, skillData]);
    resetForm();
  };

  const handleDelete = (id: string) => {
    onChange(skills.filter((skill) => skill.id !== id));
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSuggestionClick = (suggestionName: string) => {
    setFormData({ ...formData, name: suggestionName });
  };

  const handleQuickAdd = (name: string, category: Skill['category']) => {
    const skillData: Skill = {
      id: `skill_${Date.now()}`,
      name,
      category,
      level: 'intermediate',
    };
    onChange([...skills, skillData]);
  };

  const getCurrentSuggestions = () => {
    const category = formData.category || 'technical';
    const suggestions = SKILL_SUGGESTIONS[category] || [];
    const existingSkillNames = skills.map((s) => s.name.toLowerCase());
    return suggestions.filter((s) => !existingSkillNames.includes(s.toLowerCase()));
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const getLevelColor = (level?: Skill['level']) => {
    switch (level) {
      case 'expert':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'advanced':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'beginner':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Suggestions Button */}
      {onAISuggest && (
        <div className="flex justify-end">
          <Button
            onClick={onAISuggest}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Get AI Skill Suggestions
          </Button>
        </div>
      )}

      {/* Grouped Skills Display */}
      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
        <div key={category}>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize">
            {SKILL_CATEGORIES.find((c) => c.value === category)?.label || category}
          </h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {categorySkills.map((skill) => (
              <div
                key={skill.id}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"
              >
                <span className="text-sm font-medium">{skill.name}</span>
                {skill.level && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(skill.level)}`}
                  >
                    {skill.level}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(skill.id)}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add New Skill Form */}
      {isAdding && (
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Add Skill</h4>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Input
                label="Skill Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., React, Leadership"
                required
              />
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as Skill['category'] })
                }
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Proficiency Level"
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value as Skill['level'] })
                }
              >
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Suggestions */}
            <div>
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                {showSuggestions ? 'Hide' : 'Show'} suggestions for{' '}
                {SKILL_CATEGORIES.find((c) => c.value === formData.category)?.label || 'this category'}
              </button>
              {showSuggestions && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {getCurrentSuggestions().map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                  {getCurrentSuggestions().length === 0 && (
                    <p className="text-sm text-gray-500">No more suggestions available</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSave} size="sm" disabled={isLoading || !formData.name}>
                <Plus className="w-4 h-4 mr-2" />
                Add Skill
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Add Suggestions */}
      {!isAdding && skills.length === 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3">Quick Add Popular Skills</h4>
          <div className="space-y-3">
            {Object.entries(SKILL_SUGGESTIONS).map(([category, suggestions]) => (
              <div key={category}>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 capitalize">
                  {SKILL_CATEGORIES.find((c) => c.value === category)?.label || category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 5).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() =>
                        handleQuickAdd(suggestion, category as Skill['category'])
                      }
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Button */}
      {!isAdding && (
        <Button onClick={handleAdd} variant="outline" className="w-full" disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Skill
        </Button>
      )}

      {skills.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 text-center py-2">
          No skills added yet. Click the button above or use quick add suggestions.
        </p>
      )}
    </div>
  );
}
