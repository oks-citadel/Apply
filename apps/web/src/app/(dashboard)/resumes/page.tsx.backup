'use client';

import { useState } from 'react';
import { Plus, FileText, Download, Edit2, Trash2, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default function ResumesPage() {
  const [resumes] = useState([
    {
      id: '1',
      name: 'Software Engineer Resume',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      isDefault: true,
      applications: 8,
    },
    {
      id: '2',
      name: 'Frontend Developer Resume',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      isDefault: false,
      applications: 5,
    },
    {
      id: '3',
      name: 'Full Stack Resume',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-15',
      isDefault: false,
      applications: 3,
    },
  ]);

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
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Resume
        </Button>
      </div>

      {/* Resume Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resumes.map((resume) => (
          <Card key={resume.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="w-10 h-10 text-primary-600" />
                {resume.isDefault && (
                  <Badge variant="default">Default</Badge>
                )}
              </div>
              <CardTitle className="mt-4">{resume.name}</CardTitle>
              <CardDescription>
                Updated {new Date(resume.updatedAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Applications</span>
                  <span className="font-medium">{resume.applications}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/dashboard/resumes/${resume.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Card */}
        <Card className="border-dashed border-2 hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-primary-600" />
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
    </div>
  );
}
