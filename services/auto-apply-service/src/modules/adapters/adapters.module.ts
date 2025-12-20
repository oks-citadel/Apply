import { Module } from '@nestjs/common';

import { GreenhouseAdapter } from './greenhouse.adapter';
import { IcimsAdapter } from './icims.adapter';
import { IndeedAdapter } from './indeed.adapter';
import { LeverAdapter } from './lever.adapter';
import { LinkedInAdapter } from './linkedin.adapter';
import { SmartRecruitersAdapter } from './smartrecruiters.adapter';
import { TaleoAdapter } from './taleo.adapter';
import { WorkdayAdapter } from './workday.adapter';
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
