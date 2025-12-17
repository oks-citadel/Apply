'use client';

import React from 'react';

interface Applicant {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'reviewed' | 'interviewed' | 'hired' | 'rejected';
  appliedAt: Date;
  resumeUrl?: string;
}

interface ApplicantListProps {
  jobId: string;
}

export function ApplicantList({ jobId }: ApplicantListProps) {
  const [applicants, setApplicants] = React.useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/applicants`);
        const data = await response.json();
        setApplicants(data);
      } catch (err) {
        setError('Failed to load applicants');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicants();
  }, [jobId]);

  if (isLoading) {
    return <div>Loading applicants...</div>;
  }

  if (error) {
    return <div role="alert">{error}</div>;
  }

  if (applicants.length === 0) {
    return <div>No applicants yet</div>;
  }

  return (
    <div>
      <h2>Applicants ({applicants.length})</h2>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Applied</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((applicant) => (
            <tr key={applicant.id}>
              <td>{applicant.name}</td>
              <td>{applicant.email}</td>
              <td>{applicant.status}</td>
              <td>{new Date(applicant.appliedAt).toLocaleDateString()}</td>
              <td>
                <button>View</button>
                <button>Update Status</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ApplicantList;
