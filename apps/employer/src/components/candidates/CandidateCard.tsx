import Link from 'next/link';
import { MapPin, Briefcase, Mail, Calendar } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  education: string;
  summary: string;
  availableDate: string;
}

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-start space-x-4 mb-4">
        <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0">
          {candidate.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/candidates/${candidate.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-primary-600 truncate block"
          >
            {candidate.name}
          </Link>
          <p className="text-sm text-gray-600 truncate">{candidate.title}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">{candidate.location}</span>
        </div>
        <div className="flex items-center">
          <Briefcase className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
          <span>{candidate.experience} experience</span>
        </div>
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">{candidate.email}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
          <span>Available: {candidate.availableDate}</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700 line-clamp-3">{candidate.summary}</p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
        <div className="flex flex-wrap gap-2">
          {candidate.skills.slice(0, 4).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium"
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 4 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
              +{candidate.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Link
          href={`/candidates/${candidate.id}`}
          className="flex-1 text-center px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
        >
          View Profile
        </Link>
        <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
          Contact
        </button>
      </div>
    </div>
  );
}
