import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Certification } from './entities/certification.entity';
import { Profile } from './entities/profile.entity';
import { ProfileSectionsService } from './profile-sections.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { Education } from '../career/entities/education.entity';
import { WorkExperience } from '../career/entities/work-experience.entity';
import { Skill } from '../skills/entities/skill.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      WorkExperience,
      Education,
      Skill,
      Certification,
    ]),
    StorageModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileSectionsService],
  exports: [ProfileService, ProfileSectionsService],
})
export class ProfileModule {}
