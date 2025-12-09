import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { TemplatePreview } from './TemplatePreview';
import { RESUME_TEMPLATES } from '@/data/templates';
import { Layout, Check } from 'lucide-react';
import Link from 'next/link';

interface TemplateSelectorProps {
  currentTemplateId: string;
  resumeId: string;
  onTemplateChange: (templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  currentTemplateId,
  resumeId,
  onTemplateChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(currentTemplateId);

  const currentTemplate = RESUME_TEMPLATES.find((t) => t.id === currentTemplateId);

  const handleApply = () => {
    if (selectedTemplateId !== currentTemplateId) {
      onTemplateChange(selectedTemplateId);
    }
    setIsOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Layout className="w-4 h-4 mr-2" />
        Change Template
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Change Template"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a new template for your resume. Your content will be preserved.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto p-2">
            {RESUME_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplateId === template.id
                    ? 'ring-2 ring-primary-600 ring-offset-2'
                    : ''
                }`}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <TemplatePreview
                  template={template}
                  selected={selectedTemplateId === template.id}
                  onSelect={() => setSelectedTemplateId(template.id)}
                  showDetails={true}
                  scale={0.15}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Link href="/resumes/templates">
              <Button variant="ghost" size="sm">
                Browse All Templates
              </Button>
            </Link>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply}>
                <Check className="w-4 h-4 mr-2" />
                Apply Template
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TemplateSelector;
