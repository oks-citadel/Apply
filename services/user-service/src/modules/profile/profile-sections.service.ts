import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';


import { Certification } from './entities/certification.entity';
import { Education } from '../career/entities/education.entity';
import { WorkExperience } from '../career/entities/work-experience.entity';
import { Skill } from '../skills/entities/skill.entity';

import {
  CreateCertificationDto,
  UpdateCertificationDto,
} from './dto/certification.dto';
import { CreateEducationDto, UpdateEducationDto } from './dto/education.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import {
  CreateWorkExperienceDto,
  UpdateWorkExperienceDto,
} from './dto/work-experience.dto';
import { Repository } from 'typeorm';

@Injectable()
export class ProfileSectionsService {
  constructor(
    @InjectRepository(WorkExperience)
    private workExperienceRepository: Repository<WorkExperience>,
    @InjectRepository(Education)
    private educationRepository: Repository<Education>,
    @InjectRepository(Skill)
    private skillRepository: Repository<Skill>,
    @InjectRepository(Certification)
    private certificationRepository: Repository<Certification>,
  ) {}

  // Work Experience CRUD
  async getWorkExperiences(userId: string): Promise<WorkExperience[]> {
    return this.workExperienceRepository.find({
      where: { user_id: userId },
      order: { start_date: 'DESC' },
    });
  }

  async createWorkExperience(
    userId: string,
    createDto: CreateWorkExperienceDto,
  ): Promise<WorkExperience> {
    const experience = this.workExperienceRepository.create({
      user_id: userId,
      ...createDto,
    });
    return this.workExperienceRepository.save(experience);
  }

  async updateWorkExperience(
    id: string,
    userId: string,
    updateDto: UpdateWorkExperienceDto,
  ): Promise<WorkExperience> {
    const experience = await this.workExperienceRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!experience) {
      throw new NotFoundException('Work experience not found');
    }

    Object.assign(experience, updateDto);
    return this.workExperienceRepository.save(experience);
  }

  async deleteWorkExperience(id: string, userId: string): Promise<void> {
    const result = await this.workExperienceRepository.delete({
      id,
      user_id: userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Work experience not found');
    }
  }

  // Education CRUD
  async getEducation(userId: string): Promise<Education[]> {
    return this.educationRepository.find({
      where: { user_id: userId },
      order: { start_date: 'DESC' },
    });
  }

  async createEducation(
    userId: string,
    createDto: CreateEducationDto,
  ): Promise<Education> {
    const education = this.educationRepository.create({
      user_id: userId,
      ...createDto,
    });
    return this.educationRepository.save(education);
  }

  async updateEducation(
    id: string,
    userId: string,
    updateDto: UpdateEducationDto,
  ): Promise<Education> {
    const education = await this.educationRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!education) {
      throw new NotFoundException('Education not found');
    }

    Object.assign(education, updateDto);
    return this.educationRepository.save(education);
  }

  async deleteEducation(id: string, userId: string): Promise<void> {
    const result = await this.educationRepository.delete({
      id,
      user_id: userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Education not found');
    }
  }

  // Skills CRUD
  async getSkills(userId: string): Promise<Skill[]> {
    return this.skillRepository.find({
      where: { user_id: userId },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async createSkill(userId: string, createDto: CreateSkillDto): Promise<Skill> {
    const skill = this.skillRepository.create({
      user_id: userId,
      ...createDto,
    });
    return this.skillRepository.save(skill);
  }

  async updateSkill(
    id: string,
    userId: string,
    updateDto: UpdateSkillDto,
  ): Promise<Skill> {
    const skill = await this.skillRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    Object.assign(skill, updateDto);
    return this.skillRepository.save(skill);
  }

  async deleteSkill(id: string, userId: string): Promise<void> {
    const result = await this.skillRepository.delete({
      id,
      user_id: userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Skill not found');
    }
  }

  // Certifications CRUD
  async getCertifications(userId: string): Promise<Certification[]> {
    // Note: Certification still uses profile_id, need to join with Profile
    // For now, we'll just return based on profile_id parameter  
    // TODO: Update Certification entity to use user_id instead of profile_id
    return this.certificationRepository.find({
      where: { profile_id: userId },
      order: { issue_date: 'DESC' },
    });
  }

  async createCertification(
    userId: string,
    createDto: CreateCertificationDto,
  ): Promise<Certification> {
    const certification = this.certificationRepository.create({
      profile_id: userId,
      ...createDto,
    });
    return this.certificationRepository.save(certification);
  }

  async updateCertification(
    id: string,
    userId: string,
    updateDto: UpdateCertificationDto,
  ): Promise<Certification> {
    const certification = await this.certificationRepository.findOne({
      where: { id, profile_id: userId },
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    Object.assign(certification, updateDto);
    return this.certificationRepository.save(certification);
  }

  async deleteCertification(id: string, userId: string): Promise<void> {
    const result = await this.certificationRepository.delete({
      id,
      profile_id: userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Certification not found');
    }
  }
}
