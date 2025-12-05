'use client';

import { useState } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Bookmark, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs] = useState([
    {
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$120k - $150k',
      description: 'We are looking for an experienced Frontend Developer to join our team...',
      tags: ['React', 'TypeScript', 'Next.js'],
      postedAt: '2 days ago',
      saved: false,
    },
    {
      id: '2',
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Remote',
      type: 'Full-time',
      salary: '$100k - $140k',
      description: 'Join our fast-growing startup as a Full Stack Engineer...',
      tags: ['Node.js', 'React', 'AWS'],
      postedAt: '3 days ago',
      saved: true,
    },
    {
      id: '3',
      title: 'React Developer',
      company: 'Digital Agency',
      location: 'New York, NY',
      type: 'Contract',
      salary: '$80k - $110k',
      description: 'Looking for a skilled React Developer for a 6-month contract...',
      tags: ['React', 'JavaScript', 'CSS'],
      postedAt: '5 days ago',
      saved: false,
    },
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Job Search
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find and save job opportunities that match your skills
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by title, keyword, or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select>
                <option value="">Location</option>
                <option value="remote">Remote</option>
                <option value="sf">San Francisco</option>
                <option value="ny">New York</option>
                <option value="la">Los Angeles</option>
              </Select>
              <Select>
                <option value="">Job Type</option>
                <option value="fulltime">Full-time</option>
                <option value="parttime">Part-time</option>
                <option value="contract">Contract</option>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Filter by Salary
              </Button>
              <Button variant="outline" size="sm">
                Experience Level
              </Button>
              <Button variant="outline" size="sm">
                Company Size
              </Button>
              <Button variant="ghost" size="sm" className="text-primary-600">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {jobs.length} jobs
          </p>
          <Select className="w-48">
            <option value="recent">Most Recent</option>
            <option value="relevant">Most Relevant</option>
            <option value="salary">Highest Salary</option>
          </Select>
        </div>

        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{job.company}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={job.saved ? 'text-primary-600' : ''}
                    >
                      <Bookmark className={`w-5 h-5 ${job.saved ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      {job.type}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {job.salary}
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Posted {job.postedAt}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">Load More Jobs</Button>
      </div>
    </div>
  );
}
