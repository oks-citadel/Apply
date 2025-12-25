import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';


import { Preference } from './entities/preference.entity';

import { Repository } from 'typeorm';

import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(Preference)
    private preferenceRepository: Repository<Preference>,
  ) {}

  async getPreferences(userId: string): Promise<Preference> {
    let preference = await this.preferenceRepository.findOne({
      where: { user_id: userId },
    });

    if (!preference) {
      // Create default preferences if they don't exist
      preference = await this.createPreferences(userId);
    }

    return preference;
  }

  async createPreferences(userId: string): Promise<Preference> {
    const preference = this.preferenceRepository.create({
      user_id: userId,
      target_job_titles: [],
      target_locations: [],
      industries: [],
      excluded_companies: [],
      preferred_company_sizes: [],
      required_benefits: [],
    });

    return this.preferenceRepository.save(preference);
  }

  async updatePreferences(userId: string, updateDto: UpdatePreferenceDto): Promise<Preference> {
    let preference = await this.preferenceRepository.findOne({
      where: { user_id: userId },
    });

    if (!preference) {
      preference = await this.createPreferences(userId);
    }

    Object.assign(preference, updateDto);

    return this.preferenceRepository.save(preference);
  }

  async deletePreferences(userId: string): Promise<void> {
    const preference = await this.preferenceRepository.findOne({
      where: { user_id: userId },
    });

    if (preference) {
      await this.preferenceRepository.remove(preference);
    }
  }
}
