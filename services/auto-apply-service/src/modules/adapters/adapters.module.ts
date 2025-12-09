import { Module } from '@nestjs/common';
import { WorkdayAdapter } from './workday.adapter';
import { GreenhouseAdapter } from './greenhouse.adapter';
import { LeverAdapter } from './lever.adapter';
import { IcimsAdapter } from './icims.adapter';
import { TaleoAdapter } from './taleo.adapter';
import { SmartRecruitersAdapter } from './smartrecruiters.adapter';
import { LinkedInAdapter } from './linkedin.adapter';
import { IndeedAdapter } from './indeed.adapter';
import { BrowserModule } from '../browser/browser.module';
import { FormMappingModule } from '../form-mapping/form-mapping.module';

@Module({
  imports: [BrowserModule, FormMappingModule],
  providers: [
    WorkdayAdapter,
    GreenhouseAdapter,
    LeverAdapter,
    IcimsAdapter,
    TaleoAdapter,
    SmartRecruitersAdapter,
    LinkedInAdapter,
    IndeedAdapter,
  ],
  exports: [
    WorkdayAdapter,
    GreenhouseAdapter,
    LeverAdapter,
    IcimsAdapter,
    TaleoAdapter,
    SmartRecruitersAdapter,
    LinkedInAdapter,
    IndeedAdapter,
  ],
})
export class AdaptersModule {}
