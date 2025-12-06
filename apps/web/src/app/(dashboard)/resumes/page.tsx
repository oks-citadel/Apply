'use client';

import { useState, useCallback } from 'react';
import { Plus, FileText, Download, Edit2, Trash2, Copy, Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useResumes,
  useDeleteResume,
  useDuplicateResume,
  useExportResume,
  useSetDefaultResume,
  useCreateResume,
} from '@/hooks/useResumes';

export default function ResumesPage() {
  const router = useRouter();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'json'>('pdf');

  const { data, isLoading } = useResumes();
  const deleteResume = useDeleteResume();
  const duplicateResume = useDuplicateResume();
  const exportResume = useExportResume();
  const setDefaultResume = useSetDefaultResume();
  const createResume = useCreateResume();

  const resumes = data?.resumes || [];

  const handleDelete = useCallback((id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteResume.mutate(id);
    }
  }, [deleteResume]);

  const handleDuplicate = useCallback((id: string) => {
    duplicateResume.mutate(id);
  }, [duplicateResume]);

  const handleExport = useCallback((id: string, format: 'pdf' | 'docx' | 'json') => {
    exportResume.mutate({ id, format });
  }, [exportResume]);

  const handleSetDefault = useCallback((id: string) => {
    setDefaultResume.mutate(id);
  }, [setDefaultResume]);

  const handleCreateNew = useCallback(() => {
    createResume.mutate(
      {
        name: 'New Resume',
        template: 'modern',
        personalInfo: {
          fullName: '',
          email: '',
          phone: '',
        },
      },
      {
        onSuccess: (newResume) => {
          router.push(`/resumes/${newResume.id}`);
        },
      }
    );
  }, [createResume, router]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Resumes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and customize your resumes for different job applications
          </p>
        </div>
        <Button onClick={handleCreateNew} disabled={createResume.isPending}>
          {createResume.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Create New Resume
        </Button>
      </div>

      {/* Resume Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : resumes.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No resumes yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first resume to start applying to jobs
            </p>
            <Button onClick={handleCreateNew} disabled={createResume.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume: any) => (
            <Card key={resume.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="w-10 h-10 text-primary-600" />
                  <div className="flex items-center gap-2">
                    {!resume.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(resume.id)}
                        disabled={setDefaultResume.isPending}
                        title="Set as default"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    {resume.isDefault && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="mt-4">{resume.name}</CardTitle>
                <CardDescription>
                  Updated {formatDate(resume.updatedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Applications</span>
                    <span className="font-medium">{resume.applicationCount || 0}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/resumes/${resume.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(resume.id, 'pdf')}
                      disabled={exportResume.isPending}
                    >
                      {exportResume.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      PDF
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(resume.id)}
                      disabled={duplicateResume.isPending}
                    >
                      {duplicateResume.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(resume.id, resume.name)}
                      disabled={deleteResume.isPending || resume.isDefault}
                      title={resume.isDefault ? "Cannot delete default resume" : "Delete resume"}
                    >
                      {deleteResume.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Card */}
          <Card
            className="border-dashed border-2 hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors cursor-pointer"
            onClick={handleCreateNew}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                {createResume.isPending ? (
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                ) : (
                  <Plus className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create New Resume
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Start from scratch or use a template
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}
