'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CandidateCard } from '@/components/candidates/CandidateCard';
import { Search, Filter, MapPin, Briefcase } from 'lucide-react';

export default function CandidatesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    experience: '',
    skills: '',
  });

  // Mock data - replace with actual API call
  const candidates = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '',
      title: 'Senior Frontend Developer',
      location: 'San Francisco, CA',
      experience: '5 years',
      skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
      education: 'BS Computer Science',
      summary:
        'Experienced frontend developer with a passion for creating beautiful user experiences...',
      availableDate: '2024-02-01',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: '',
      title: 'Full Stack Developer',
      location: 'New York, NY',
      experience: '7 years',
      skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
      education: 'MS Software Engineering',
      summary:
        'Full stack developer with expertise in building scalable applications...',
      availableDate: '2024-03-01',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      avatar: '',
      title: 'DevOps Engineer',
      location: 'Austin, TX',
      experience: '6 years',
      skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform'],
      education: 'BS Information Technology',
      summary:
        'DevOps engineer specialized in cloud infrastructure and automation...',
      availableDate: 'Immediately',
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      avatar: '',
      title: 'UX Designer',
      location: 'Remote',
      experience: '4 years',
      skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
      education: 'BS Design',
      summary: 'UX designer focused on creating intuitive user interfaces...',
      availableDate: '2024-02-15',
    },
  ];

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.skills.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesLocation =
      !filters.location ||
      candidate.location.toLowerCase().includes(filters.location.toLowerCase());

    const matchesExperience =
      !filters.experience || candidate.experience.includes(filters.experience);

    return matchesSearch && matchesLocation && matchesExperience;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64 pt-16">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Candidate Search
            </h1>
            <p className="mt-2 text-gray-600">
              Browse and connect with talented professionals
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, title, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Location"
                    value={filters.location}
                    onChange={(e) =>
                      setFilters({ ...filters, location: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={filters.experience}
                    onChange={(e) =>
                      setFilters({ ...filters, experience: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Experience Level</option>
                    <option value="1-2">1-2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5+">5+ years</option>
                  </select>
                </div>
                <button
                  onClick={() =>
                    setFilters({ location: '', experience: '', skills: '' })
                  }
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {filteredCandidates.length} candidates found
            </p>
          </div>

          {/* Candidate Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No candidates found</p>
              </div>
            ) : (
              filteredCandidates.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
