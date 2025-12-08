import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkExperience } from './entities/work-experience.entity';
import { Education } from './entities/education.entity';
import { Skill } from './entities/skill.entity';
import { Certification } from './entities/certification.entity';
import {
  CreateWorkExperienceDto,
  UpdateWorkExperienceDto,
} from './dto/work-experience.dto';
import { CreateEducationDto, UpdateEducationDto } from './dto/education.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import {
  CreateCertificationDto,
  UpdateCertificationDto,
} from './dto/certification.dto';

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
  async getWorkExperiences(profileId: string): Promise<WorkExperience[]> {
    return this.workExperienceRepository.find({
      where: { profile_id: profileId },
      order: { start_date: 'DESC' },
    });
  }

  async createWorkExperience(
    profileId: string,
    createDto: CreateWorkExperienceDto,
  ): Promise<WorkExperience> {
    const experience = this.workExperienceRepository.create({
      profile_id: profileId,
      ...createDto,
    });
    return this.workExperienceRepository.save(experience);
  }

  async updateWorkExperience(
    id: string,
    profileId: string,
    updateDto: UpdateWorkExperienceDto,
  ): Promise<WorkExperience> {
    const experience = await this.workExperienceRepository.findOne({
      where: { id, profile_id: profileId },
    });

    if (!experience) {
      throw new NotFoundException('Work experience not found');
    }

    Object.assign(experience, updateDto);
    return this.workExperienceRepository.save(experience);
  }

  async deleteWorkExperience(id: string, profileId: string): Promise<void> {
    const result = await this.workExperienceRepository.delete({
      id,
      profile_id: profileId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Work experience not found');
    }
  }

  // Education CRUD
  async getEducation(profileId: string): Promise<Education[]> {
    return this.educationRepository.find({
      where: { profile_id: profileId },
      order: { start_date: 'DESC' },
    });
  }

  async createEducation(
    profileId: string,
    createDto: CreateEducationDto,
  ): Promise<Education> {
    const education = this.educationRepository.create({
      profile_id: profileId,
      ...createDto,
    });
    return this.educationRepository.save(education);
  }

  async updateEducation(
    id: string,
    profileId: string,
    updateDto: UpdateEducationDto,
  ): Promise<Education> {
    const education = await this.educationRepository.findOne({
      where: { id, profile_id: profileId },
    });

    if (!education) {
      throw new NotFoundException('Education not found');
    }

    Object.assign(education, updateDto);
    return this.educationRepository.save(education);
  }

  async deleteEducation(id: string, profileId: string): Promise<void> {
    const result = await this.educationRepository.delete({
      id,
      profile_id: profileId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Education not found');
    }
  }

  // Skills CRUD
  async getSkills(profileId: string): Promise<Skill[]> {
    return this.skillRepository.find({
      where: { profile_id: profileId },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async createSkill(profileId: string, createDto: CreateSkillDto): Promise<Skill> {
    const skill = this.skillRepository.create({
      profile_id: profileId,
      ...createDto,
    });
    return this.skillRepository.save(skill);
  }

  async updateSkill(
    id: string,
    profileId: string,
    updateDto: UpdateSkillDto,
  ): Promise<Skill> {
    const skill = await this.skillRepository.findOne({
      where: { id, profile_id: profileId },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    Object.assign(skill, updateDto);
    return this.skillRepository.save(skill);
  }

  async deleteSkill(id: string, profileId: string): Promise<void> {
    const result = await this.skillRepository.delete({
      id,
      profile_id: profileId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Skill not found');
    }
  }

  // Certifications CRUD
  async getCertifications(profileId: string): Promise<Certification[]> {
    return this.certificationRepository.find({
      where: { profile_id: profileId },
      order: { issue_date: 'DESC' },
    });
  }

  async createCertification(
    profileId: string,
    createDto: CreateCertificationDto,
  ): Promise<Certification> {
    const certification = this.certificationRepository.create({
      profile_id: profileId,
      ...createDto,
    });
    return this.certificationRepository.save(certification);
  }

  async updateCertification(
    id: string,
    profileId: string,
    updateDto: UpdateCertificationDto,
  ): Promise<Certification> {
    const certification = await this.certificationRepository.findOne({
      where: { id, profile_id: profileId },
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    Object.assign(certification, updateDto);
    return this.certificationRepository.save(certification);
  }

  async deleteCertification(id: string, profileId: string): Promise<void> {
    const result = await this.certificationRepository.delete({
      id,
      profile_id: profileId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Certification not found');
    }
  }
}
