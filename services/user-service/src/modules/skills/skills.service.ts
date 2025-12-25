import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';


import { Skill } from './entities/skill.entity';

import { Repository } from 'typeorm';

import { CreateSkillDto, UpdateSkillDto } from './dto/create-skill.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private skillRepository: Repository<Skill>,
  ) {}

  async getAllSkills(userId: string): Promise<Skill[]> {
    return this.skillRepository.find({
      where: { user_id: userId },
      order: { is_primary: 'DESC', created_at: 'DESC' },
    });
  }

  async getSkillById(userId: string, id: string): Promise<Skill> {
    const skill = await this.skillRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  async createSkill(userId: string, createDto: CreateSkillDto): Promise<Skill> {
    // Check if skill already exists for this user
    const existingSkill = await this.skillRepository.findOne({
      where: { user_id: userId, name: createDto.name },
    });

    if (existingSkill) {
      throw new BadRequestException('Skill already exists');
    }

    const skill = this.skillRepository.create({
      ...createDto,
      user_id: userId,
    });

    return this.skillRepository.save(skill);
  }

  async updateSkill(userId: string, id: string, updateDto: UpdateSkillDto): Promise<Skill> {
    const skill = await this.getSkillById(userId, id);

    Object.assign(skill, updateDto);

    return this.skillRepository.save(skill);
  }

  async deleteSkill(userId: string, id: string): Promise<void> {
    const skill = await this.getSkillById(userId, id);
    await this.skillRepository.remove(skill);
  }

  async getSkillSuggestions(userId: string): Promise<{ suggestions: string[] }> {
    // Get user's existing skills
    const userSkills = await this.getAllSkills(userId);
    const existingSkillNames = userSkills.map((s) => s.name.toLowerCase());

    // Common skill suggestions based on tech categories
    const skillCategories = {
      'Programming Languages': [
        'JavaScript',
        'TypeScript',
        'Python',
        'Java',
        'C#',
        'Go',
        'Rust',
        'Ruby',
        'PHP',
        'Swift',
        'Kotlin',
      ],
      'Frontend': [
        'React',
        'Vue.js',
        'Angular',
        'HTML',
        'CSS',
        'Tailwind CSS',
        'Next.js',
        'Redux',
        'Webpack',
      ],
      'Backend': [
        'Node.js',
        'Express',
        'NestJS',
        'Django',
        'Flask',
        'Spring Boot',
        'ASP.NET',
        'Laravel',
      ],
      'Databases': [
        'PostgreSQL',
        'MySQL',
        'MongoDB',
        'Redis',
        'Elasticsearch',
        'DynamoDB',
        'Cassandra',
      ],
      'Cloud & DevOps': [
        'AWS',
        'Azure',
        'Google Cloud',
        'Docker',
        'Kubernetes',
        'Terraform',
        'Jenkins',
        'GitLab CI',
        'GitHub Actions',
      ],
      'Tools & Practices': [
        'Git',
        'Agile',
        'Scrum',
        'REST API',
        'GraphQL',
        'Microservices',
        'CI/CD',
        'Test-Driven Development',
      ],
    };

    // Flatten all suggestions
    const allSuggestions = Object.values(skillCategories).flat();

    // Filter out skills user already has
    const suggestions = allSuggestions
      .filter((skill) => !existingSkillNames.includes(skill.toLowerCase()))
      .slice(0, 20); // Limit to 20 suggestions

    return { suggestions };
  }

  async getSkillsByCategory(userId: string): Promise<Record<string, Skill[]>> {
    const skills = await this.getAllSkills(userId);

    const grouped: Record<string, Skill[]> = {};

    for (const skill of skills) {
      const category = skill.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(skill);
    }

    return grouped;
  }
}
