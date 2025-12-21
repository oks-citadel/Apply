import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Profile } from './entities/profile.entity';
import { StorageService } from '../storage/storage.service';

import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private storageService: StorageService,
  ) {}

  async getProfile(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      // Create a new profile if it doesn't exist
      return this.createProfile(userId);
    }

    return profile;
  }

  async createProfile(userId: string): Promise<Profile> {
    const profile = this.profileRepository.create({
      user_id: userId,
      completeness_score: 0,
    });

    return this.profileRepository.save(profile);
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<Profile> {
    let profile = await this.profileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      profile = await this.createProfile(userId);
    }

    Object.assign(profile, updateDto);

    // Recalculate completeness score
    profile.completeness_score = this.calculateCompletenessScore(profile);

    return this.profileRepository.save(profile);
  }

  async uploadProfilePhoto(userId: string, file: Express.Multer.File): Promise<{ url: string }> {
    const profile = await this.getProfile(userId);

    // Delete old photo if exists
    if (profile.profile_photo_url) {
      await this.storageService.deleteFile(profile.profile_photo_url);
    }

    // Upload new photo using the dedicated profile picture method
    const photoUrl = await this.storageService.uploadProfilePicture(
      userId,
      file.buffer,
      file.mimetype,
    );

    profile.profile_photo_url = photoUrl;
    profile.completeness_score = this.calculateCompletenessScore(profile);

    await this.profileRepository.save(profile);

    return { url: photoUrl };
  }

  async deleteProfilePhoto(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);

    if (profile.profile_photo_url) {
      await this.storageService.deleteFile(profile.profile_photo_url);
      profile.profile_photo_url = null;
      profile.completeness_score = this.calculateCompletenessScore(profile);
      await this.profileRepository.save(profile);
    }
  }

  async getCompletenessScore(userId: string): Promise<{ score: number; missing: string[] }> {
    const profile = await this.getProfile(userId);

    const missingFields: string[] = [];
    const fields = {
      full_name: 'Full Name',
      headline: 'Professional Headline',
      bio: 'Bio',
      phone: 'Phone Number',
      location: 'Location',
      profile_photo_url: 'Profile Photo',
      linkedin_url: 'LinkedIn URL',
      github_url: 'GitHub URL',
    };

    for (const [field, label] of Object.entries(fields)) {
      if (!profile[field]) {
        missingFields.push(label);
      }
    }

    return {
      score: profile.completeness_score,
      missing: missingFields,
    };
  }

  private calculateCompletenessScore(profile: Profile): number {
    const fields = [
      'full_name',
      'headline',
      'bio',
      'phone',
      'location',
      'profile_photo_url',
      'linkedin_url',
      'github_url',
    ];

    let completedFields = 0;
    for (const field of fields) {
      if (profile[field]) {
        completedFields++;
      }
    }

    return Math.round((completedFields / fields.length) * 100);
  }
}
