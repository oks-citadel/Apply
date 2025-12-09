'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Download,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

export default function CandidateProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock data - replace with actual API call
  const candidate = {
    id: params.id,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    avatar: '',
    title: 'Senior Frontend Developer',
    location: 'San Francisco, CA',
    experience: '5 years',
    skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'Node.js'],
    education: [
      {
        degree: 'BS Computer Science',
        school: 'University of California, Berkeley',
        year: '2016-2020',
      },
    ],
    workExperience: [
      {
        title: 'Senior Frontend Developer',
        company: 'Tech Corp',
        period: '2021 - Present',
        description:
          'Lead frontend development for enterprise applications using React and TypeScript.',
      },
      {
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        period: '2020 - 2021',
        description:
          'Built and maintained customer-facing web applications.',
      },
    ],
    summary:
      'Experienced frontend developer with a passion for creating beautiful and performant user experiences. Specialized in React ecosystem with 5 years of professional experience.',
    availableDate: '2024-02-01',
    resumeUrl: '/resumes/john-doe.pdf',
    portfolioUrl: 'https://johndoe.dev',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    githubUrl: 'https://github.com/johndoe',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64 pt-16">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/candidates"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Candidates
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Overview */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-20">
                <div className="text-center mb-6">
                  <div className="h-24 w-24 rounded-full bg-primary-600 mx-auto flex items-center justify-center text-white text-3xl font-bold">
                    {candidate.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-gray-900">
                    {candidate.name}
                  </h2>
                  <p className="text-gray-600">{candidate.title}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <a
                      href={`mailto:${candidate.email}`}
                      className="hover:text-primary-600"
                    >
                      {candidate.email}
                    </a>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {candidate.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2" />
                    {candidate.experience} experience
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Available: {candidate.availableDate}
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href={candidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Resume
                  </a>
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </button>
                </div>

                {/* Social Links */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Links
                  </h3>
                  <div className="space-y-2">
                    {candidate.portfolioUrl && (
                      <a
                        href={candidate.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary-600 hover:text-primary-700"
                      >
                        Portfolio
                      </a>
                    )}
                    {candidate.linkedinUrl && (
                      <a
                        href={candidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary-600 hover:text-primary-700"
                      >
                        LinkedIn
                      </a>
                    )}
                    {candidate.githubUrl && (
                      <a
                        href={candidate.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary-600 hover:text-primary-700"
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Professional Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {candidate.summary}
                </p>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Work Experience */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Work Experience
                </h3>
                <div className="space-y-6">
                  {candidate.workExperience.map((job, index) => (
                    <div key={index} className="relative pl-6 pb-6 border-l-2 border-gray-200 last:pb-0">
                      <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary-600 border-4 border-white" />
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">
                          {job.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {job.company} • {job.period}
                        </p>
                        <p className="mt-2 text-sm text-gray-700">
                          {job.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <GraduationCap className="inline h-5 w-5 mr-2" />
                  Education
                </h3>
                <div className="space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div key={index}>
                      <h4 className="text-base font-semibold text-gray-900">
                        {edu.degree}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {edu.school} • {edu.year}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
