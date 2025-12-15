import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IJobAdapter, IJobAdapterFactory } from '../interfaces/job-adapter.interface';
import { JobSource, SourceProvider } from '../entities/job-source.entity';

// Job Board Adapters
import { LinkedInAdapter } from './linkedin.adapter';
import { IndeedAdapter } from './indeed.adapter';
import { GlassdoorAdapter } from './glassdoor.adapter';
import { GoogleJobsAdapter } from './google-jobs.adapter';
import { ZipRecruiterAdapter } from './ziprecruiter.adapter';

// ATS Adapters
import { GreenhouseAdapter } from './greenhouse.adapter';
import { LeverAdapter } from './lever.adapter';
import { WorkdayAdapter } from './workday.adapter';
import { BambooHRAdapter } from './bamboohr.adapter';

// Remote Platform Adapters
import { WellfoundAdapter } from './wellfound.adapter';
import { RemoteOKAdapter } from './remoteok.adapter';
import { WeWorkRemotelyAdapter } from './weworkremotely.adapter';

// Government Job Board Adapters
import { USAJobsAdapter } from './usajobs.adapter';
import { UKCivilServiceAdapter } from './uk-civil-service.adapter';

@Injectable()
export class JobAdapterFactory implements IJobAdapterFactory {
  private adapterMap: Map<SourceProvider, new (httpService: HttpService) => IJobAdapter>;

  constructor(private readonly httpService: HttpService) {
    this.initializeAdapterMap();
  }

  private initializeAdapterMap(): void {
    this.adapterMap = new Map([
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
