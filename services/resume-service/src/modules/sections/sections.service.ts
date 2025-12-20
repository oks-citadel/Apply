import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';


import { Section } from './entities/section.entity';

import type { CreateSectionDto } from './dto/create-section.dto';
import type { UpdateSectionDto } from './dto/update-section.dto';
import type { Repository } from 'typeorm';

@Injectable()
export class SectionsService {
  private readonly logger = new Logger(SectionsService.name);

  constructor(
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
  ) {}

  async create(resumeId: string, createSectionDto: CreateSectionDto): Promise<Section> {
    this.logger.log(`Creating section for resume ${resumeId}`);

    const section = this.sectionRepository.create({
      ...createSectionDto,
      resumeId,
    });

    return await this.sectionRepository.save(section);
  }

  async findAll(resumeId: string): Promise<Section[]> {
    return await this.sectionRepository.find({
      where: { resumeId },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: string, resumeId: string): Promise<Section> {
    const section = await this.sectionRepository.findOne({
      where: { id, resumeId },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return section;
  }

  async update(
    id: string,
    resumeId: string,
    updateSectionDto: UpdateSectionDto,
  ): Promise<Section> {
    const section = await this.findOne(id, resumeId);

    Object.assign(section, updateSectionDto);
    return await this.sectionRepository.save(section);
  }

  async remove(id: string, resumeId: string): Promise<void> {
    const section = await this.findOne(id, resumeId);
    await this.sectionRepository.remove(section);
    this.logger.log(`Section ${id} removed from resume ${resumeId}`);
  }

  async reorder(resumeId: string, sectionOrders: { id: string; order: number }[]): Promise<void> {
    this.logger.log(`Reordering sections for resume ${resumeId}`);

    for (const { id, order } of sectionOrders) {
      await this.sectionRepository.update({ id, resumeId }, { order });
    }
  }
}
