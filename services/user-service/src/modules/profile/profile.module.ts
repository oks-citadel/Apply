import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileSectionsService } from './profile-sections.service';
import { Profile } from './entities/profile.entity';
import { WorkExperience } from './entities/work-experience.entity';
import { Education } from './entities/education.entity';
import { Skill } from './entities/skill.entity';
import { Certification } from './entities/certification.entity';
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
