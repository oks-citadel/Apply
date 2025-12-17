'use client';

import React, { useState } from 'react';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
}

interface ProfileFormProps {
  initialData?: Partial<ProfileData>;
  onSubmit?: (data: ProfileData) => void;
}

export function ProfileForm({ initialData, onSubmit }: ProfileFormProps) {
  const [formData, setFormData] = useState<Partial<ProfileData>>(
    initialData || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      bio: '',
      location: '',
      linkedIn: '',
      github: '',
      website: '',
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        onSubmit(formData as ProfileData);
      } else {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="profile-form">
      <h2>Edit Profile</h2>

      {error && <div role="alert">{error}</div>}
      {success && <div role="status">Profile updated successfully!</div>}

      <div>
        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
        />
      </div>

      <div>
        <label htmlFor="location">Location</label>
        <input
          id="location"
          name="location"
          type="text"
          value={formData.location}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="linkedIn">LinkedIn</label>
        <input
          id="linkedIn"
          name="linkedIn"
          type="url"
          value={formData.linkedIn}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="github">GitHub</label>
        <input
          id="github"
          name="github"
          type="url"
          value={formData.github}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="url"
          value={formData.website}
          onChange={handleChange}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}

export default ProfileForm;
