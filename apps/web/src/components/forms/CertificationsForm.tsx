'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export interface Certification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
}

interface CertificationsFormProps {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
  isLoading?: boolean;
}

export function CertificationsForm({ certifications, onChange, isLoading }: CertificationsFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Certification>>({
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiration_date: '',
    credential_id: '',
    credential_url: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      issuing_organization: '',
      issue_date: '',
      expiration_date: '',
      credential_id: '',
      credential_url: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    resetForm();
  };

  const handleEdit = (cert: Certification) => {
    setEditingId(cert.id);
    setFormData({ ...cert });
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.issuing_organization || !formData.issue_date) {
      return;
    }

    const certificationData: Certification = {
      id: editingId || `cert_${Date.now()}`,
      name: formData.name || '',
      issuing_organization: formData.issuing_organization || '',
      issue_date: formData.issue_date || '',
      expiration_date: formData.expiration_date,
      credential_id: formData.credential_id,
      credential_url: formData.credential_url,
    };

    if (editingId) {
      onChange(certifications.map((cert) => (cert.id === editingId ? certificationData : cert)));
    } else {
      onChange([...certifications, certificationData]);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this certification?')) {
      onChange(certifications.filter((cert) => cert.id !== id));
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Existing Certifications */}
      {certifications.map((cert) => (
        <Card key={cert.id} className="p-4">
          {editingId === cert.id ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Certification Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="AWS Certified Solutions Architect"
                  required
                />
                <Input
                  label="Issuing Organization"
                  value={formData.issuing_organization}
                  onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
                  placeholder="Amazon Web Services"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Issue Date"
                  type="month"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  required
                />
                <Input
                  label="Expiration Date (Optional)"
                  type="month"
                  value={formData.expiration_date || ''}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Credential ID (Optional)"
                  value={formData.credential_id || ''}
                  onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
                  placeholder="AWS-12345-67890"
                />
                <Input
                  label="Credential URL (Optional)"
                  type="url"
                  value={formData.credential_url || ''}
                  onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                  placeholder="https://www.credly.com/badges/12345"
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
                  <h4 className="font-semibold text-lg">{cert.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{cert.issuing_organization}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Issued {formatDate(cert.issue_date)}
                    {cert.expiration_date && (
                      <>
                        {' '} • Expires {formatDate(cert.expiration_date)}
                      </>
                    )}
                  </p>
                  {cert.credential_id && (
                    <p className="text-sm text-gray-500 mt-1">
                      Credential ID: <span className="font-mono">{cert.credential_id}</span>
                    </p>
                  )}
                  {cert.credential_url && (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2"
                    >
                      View Credential
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(cert)}
                    disabled={isLoading}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cert.id)}
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

      {/* Add New Certification Form */}
      {isAdding && (
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Add Certification</h4>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Certification Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="AWS Certified Solutions Architect"
                required
              />
              <Input
                label="Issuing Organization"
                value={formData.issuing_organization}
                onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
                placeholder="Amazon Web Services"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Issue Date"
                type="month"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
              />
              <Input
                label="Expiration Date (Optional)"
                type="month"
                value={formData.expiration_date || ''}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Credential ID (Optional)"
                value={formData.credential_id || ''}
                onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
                placeholder="AWS-12345-67890"
              />
              <Input
                label="Credential URL (Optional)"
                type="url"
                value={formData.credential_url || ''}
                onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                placeholder="https://www.credly.com/badges/12345"
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
          Add Certification
        </Button>
      )}

      {certifications.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 text-center py-4">
          No certifications added yet. Click the button above to add your first certification.
        </p>
      )}
    </div>
  );
}
