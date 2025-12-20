import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';


import { Education } from './entities/education.entity';
import { WorkExperience } from './entities/work-experience.entity';

import type { CreateEducationDto, UpdateEducationDto } from './dto/create-education.dto';
import type { CreateWorkExperienceDto, UpdateWorkExperienceDto } from './dto/create-work-experience.dto';
import type { Repository } from 'typeorm';

@Injectable()
export class CareerService {
  constructor(
    @InjectRepository(WorkExperience)
    private workExperienceRepository: Repository<WorkExperience>,
    @InjectRepository(Education)
    private educationRepository: Repository<Education>,
  ) {}

  // Work Experience Methods
  async getAllWorkExperiences(userId: string): Promise<WorkExperience[]> {
    return this.workExperienceRepository.find({
      where: { user_id: userId },
      order: { start_date: 'DESC' },
    });
  }

  async getWorkExperienceById(userId: string, id: string): Promise<WorkExperience> {
    const experience = await this.workExperienceRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!experience) {
      throw new NotFoundException('Work experience not found');
    }

    return experience;
  }

  async createWorkExperience(
    userId: string,
    createDto: CreateWorkExperienceDto,
  ): Promise<WorkExperience> {
    const experience = this.workExperienceRepository.create({
      ...createDto,
      user_id: userId,
    });

    return this.workExperienceRepository.save(experience);
  }

  async updateWorkExperience(
    userId: string,
    id: string,
    updateDto: UpdateWorkExperienceDto,
  ): Promise<WorkExperience> {
    const experience = await this.getWorkExperienceById(userId, id);

    Object.assign(experience, updateDto);

    return this.workExperienceRepository.save(experience);
  }

  async deleteWorkExperience(userId: string, id: string): Promise<void> {
    const experience = await this.getWorkExperienceById(userId, id);
    await this.workExperienceRepository.remove(experience);
  }

  // Education Methods
  async getAllEducation(userId: string): Promise<Education[]> {
    return this.educationRepository.find({
      where: { user_id: userId },
      order: { start_date: 'DESC' },
    });
  }

  async getEducationById(userId: string, id: string): Promise<Education> {
    const education = await this.educationRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!education) {
      throw new NotFoundException('Education not found');
    }

    return education;
  }

  async createEducation(userId: string, createDto: CreateEducationDto): Promise<Education> {
    const education = this.educationRepository.create({
      ...createDto,
      user_id: userId,
    });

    return this.educationRepository.save(education);
  }

  async updateEducation(
    userId: string,
    id: string,
    updateDto: UpdateEducationDto,
  ): Promise<Education> {
    const education = await this.getEducationById(userId, id);

    Object.assign(education, updateDto);

    return this.educationRepository.save(education);
  }

  async deleteEducation(userId: string, id: string): Promise<void> {
    const education = await this.getEducationById(userId, id);
    await this.educationRepository.remove(education);
  }
}
