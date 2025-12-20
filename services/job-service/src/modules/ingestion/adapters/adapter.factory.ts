import { Injectable } from '@nestjs/common';


// Job Board Adapters

// ATS Adapters
import { BambooHRAdapter } from './bamboohr.adapter';
import { GlassdoorAdapter } from './glassdoor.adapter';
import { GoogleJobsAdapter } from './google-jobs.adapter';
import { GreenhouseAdapter } from './greenhouse.adapter';
import { IndeedAdapter } from './indeed.adapter';
import { LeverAdapter } from './lever.adapter';
import { LinkedInAdapter } from './linkedin.adapter';

// Remote Platform Adapters
import { RemoteOKAdapter } from './remoteok.adapter';

// Government Job Board Adapters
import { UKCivilServiceAdapter } from './uk-civil-service.adapter';
import { USAJobsAdapter } from './usajobs.adapter';
import { WellfoundAdapter } from './wellfound.adapter';
import { WeWorkRemotelyAdapter } from './weworkremotely.adapter';
import { WorkdayAdapter } from './workday.adapter';
import { ZipRecruiterAdapter } from './ziprecruiter.adapter';
import { SourceProvider } from '../entities/job-source.entity';

import { HttpService } from '@nestjs/axios';

import type { JobSource} from '../entities/job-source.entity';
import type { IJobAdapter, IJobAdapterFactory } from '../interfaces/job-adapter.interface';

@Injectable()
export class JobAdapterFactory implements IJobAdapterFactory {
  private adapterMap: Map<SourceProvider, new (httpService: HttpService) => IJobAdapter>;

  constructor(private readonly httpService: HttpService) {
    this.initializeAdapterMap();
  }

  private initializeAdapterMap(): void {
    this.adapterMap = new Map<SourceProvider, new (httpService: HttpService) => IJobAdapter>([
      // Job Boards
      [SourceProvider.LINKEDIN, LinkedInAdapter],
      [SourceProvider.INDEED, IndeedAdapter],
      [SourceProvider.GLASSDOOR, GlassdoorAdapter],
      [SourceProvider.GOOGLE_JOBS, GoogleJobsAdapter],
      [SourceProvider.ZIPRECRUITER, ZipRecruiterAdapter],

      // ATS Platforms
      [SourceProvider.GREENHOUSE, GreenhouseAdapter],
      [SourceProvider.LEVER, LeverAdapter],
      [SourceProvider.WORKDAY, WorkdayAdapter],
      [SourceProvider.BAMBOOHR, BambooHRAdapter],

      // Remote Platforms
      [SourceProvider.WELLFOUND, WellfoundAdapter],
      [SourceProvider.REMOTEOK, RemoteOKAdapter],
      [SourceProvider.WEWORKREMOTELY, WeWorkRemotelyAdapter],

      // Government
      [SourceProvider.USAJOBS, USAJobsAdapter],
      [SourceProvider.UK_CIVIL_SERVICE, UKCivilServiceAdapter],
    ]);
  }

  createAdapter(source: JobSource): IJobAdapter {
    const AdapterClass = this.adapterMap.get(source.provider);

    if (!AdapterClass) {
      throw new Error(
        `No adapter found for provider: ${source.provider}. Available providers: ${Array.from(this.adapterMap.keys()).join(', ')}`,
      );
    }

    const adapter = new AdapterClass(this.httpService);
    return adapter;
  }

  supports(provider: string): boolean {
    return this.adapterMap.has(provider as SourceProvider);
  }

  getSupportedProviders(): SourceProvider[] {
    return Array.from(this.adapterMap.keys());
  }

  getAdapterInfo(provider: SourceProvider): {
    name: string;
    supported: boolean;
  } {
    const supported = this.supports(provider);
    const name = provider.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    return { name, supported };
  }
}
