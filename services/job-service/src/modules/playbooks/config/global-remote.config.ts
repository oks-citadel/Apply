import {
  Region,
  ResumeFormat,
  CoverLetterStyle,
  VisaType,
} from '../entities/playbook.entity';

export const globalRemotePlaybook = {
  region: Region.GLOBAL_REMOTE,
  name: 'Global Remote Professional',
  country: null,
  description: 'Optimized for fully remote positions with international teams. Emphasizes timezone flexibility, async communication skills, and digital collaboration tools.',

  // Resume Configuration
  preferred_resume_format: ResumeFormat.COMBINATION,
  resume_max_pages: 2,
  resume_section_order: {
    sections: [
      'contact',
      'summary',
      'skills',
      'remote_work_experience',
      'professional_experience',
      'education',
      'technical_proficiencies',
    ],
    optional_sections: [
      'certifications',
      'languages',
      'portfolio',
      'open_source',
      'remote_work_setup',
    ],
  },
  resume_required_sections: ['contact', 'skills', 'professional_experience', 'education'],
  include_summary_section: true,
  include_photo: false,
  include_date_of_birth: false,
  include_marital_status: false,
  page_size: 'letter', // International standard, PDF format
  preferred_fonts: ['Arial', 'Calibri', 'Helvetica', 'Open Sans'],
  recommended_font_size: 11,

  // Cover Letter Configuration
  cover_letter_style: CoverLetterStyle.SEMI_FORMAL,
  cover_letter_required: true,
  cover_letter_word_count_min: 200,
  cover_letter_word_count_max: 350,
  cover_letter_opening_template: 'Hello [Hiring Manager Name],\n\nI am excited to apply for the remote [Job Title] position at [Company Name].',
  cover_letter_closing_template: 'I look forward to contributing to [Company Name]\'s global team and discussing how my remote work experience aligns with your needs.\n\nBest regards,\n[Your Name]',

  // Salary Configuration
  salary_norms: {
    currency: 'USD', // Often USD for global remote positions
    typical_range_min: 40000,
    typical_range_max: 180000,
    negotiation_culture: 'moderate',
    salary_discussion_timing: 'early',
    benefits_importance: 'medium',
  },
  include_salary_expectations: true, // More common in remote positions
  common_benefits: [
    'Health Insurance Stipend',
    'Home Office Stipend',
    'Coworking Space Allowance',
    'Professional Development Budget',
    'Equipment Budget (laptop, monitor, etc.)',
    'Internet Reimbursement',
    'Flexible Working Hours',
    'Unlimited PTO',
    'Async-First Culture',
    'Virtual Team Building',
    'Annual Company Retreats',
    'Time Zone Flexibility',
  ],

  // ATS Systems Common in Region
  common_ats_systems: [
    'Greenhouse',
    'Lever',
    'Ashby',
    'Workable',
    'BambooHR',
    'SmartRecruiters',
    'Breezy HR',
    'Recruitee',
  ],
  ats_optimization_tips: {
    keywords: 'Emphasize remote work tools: Slack, Zoom, Asana, Notion, GitHub, etc.',
    formatting: 'Clean, minimalist formatting that works across time zones',
    file_format: 'PDF preferred for consistency',
    section_headers: 'Highlight "Remote Work Experience" prominently',
    bullet_points: 'Quantify remote collaboration achievements',
    skills_section: 'Include time zone coverage, communication tools proficiency',
  },

  // Hiring Timeline
  hiring_timeline: {
    typical_response_days: 10,
    typical_interview_rounds: 3,
    typical_total_process_days: 30,
    follow_up_acceptable: true,
    follow_up_days: 7,
  },

  // Visa and Work Authorization
  visa_requirements: VisaType.NONE_REQUIRED,
  visa_information: 'Work authorization requirements vary by company. Some companies hire internationally as contractors, others require specific country residency. Clarify legal employment structure (W2, contractor, EOR).',
  ask_work_authorization: true,
  acceptable_work_permits: [
    'Any - Remote Global',
    'US Citizen',
    'EU Citizen',
    'Authorized to work in hiring country',
    'Independent Contractor',
    'Employer of Record (EOR) arrangement',
  ],

  // Cultural Preferences
  cultural_preferences: {
    formality_level: 'casual',
    communication_style: 'direct',
    emphasis_on_education: 'medium',
    emphasis_on_experience: 'very_high',
    value_job_hopping: true, // More accepted in remote work
    preferred_references: 'optional',
    photo_on_resume: 'optional',
    age_disclosure: 'optional',
  },
  interview_tips: [
    'Ensure stable internet connection and professional video setup',
    'Test video/audio quality before the interview',
    'Eliminate background noise and distractions',
    'Emphasize past remote work experience and self-management skills',
    'Discuss timezone overlap and availability clearly',
    'Showcase async communication skills',
    'Mention home office setup and equipment',
    'Demonstrate cultural awareness and global team experience',
    'Be prepared for asynchronous interview processes (e.g., recorded video responses)',
    'Highlight results and outcomes over hours worked',
  ],
  common_interview_formats: [
    'video',
    'async_video',
    'phone_screen',
    'take_home_assignment',
    'pair_programming',
    'cultural_fit',
    'timezone_overlap_discussion',
  ],

  // Language Requirements
  primary_language: 'en',
  acceptable_languages: ['en', 'multiple_languages_preferred'],
  require_language_certification: false,

  // Application Best Practices
  application_dos: [
    'Highlight remote work experience prominently',
    'Mention timezone and availability explicitly',
    'Include links to portfolio, GitHub, LinkedIn, personal website',
    'Emphasize async communication and self-management skills',
    'List remote work tools and technologies you\'re proficient in',
    'Describe your home office setup',
    'Quantify remote collaboration achievements',
    'Include language proficiencies (important for global teams)',
    'Mention experience with distributed teams',
    'Be transparent about salary expectations (often asked upfront)',
  ],
  application_donts: [
    'Don\'t assume video interviews - some companies do async',
    'Don\'t hide your location or timezone',
    'Don\'t oversell local experience if remote-specific experience is limited',
    'Don\'t forget to mention your reliable internet connection',
    'Don\'t include irrelevant in-office experience without context',
    'Don\'t use location-specific salary expectations',
    'Don\'t ignore company culture fit (still important remotely)',
    'Don\'t forget to showcase written communication skills',
    'Don\'t assume synchronous availability',
    'Don\'t overlook time zone conversion errors',
  ],
  special_considerations: 'Remote-first companies often value outcomes over hours. Tax implications vary by location. Some companies use Employer of Record (EOR) services (Remote.com, Deel, Oyster) for international hires. Clarify employment structure early.',

  // Legal and Compliance
  protected_characteristics: [
    'Varies by company location and hiring country',
    'Generally follows jurisdiction of company registration',
  ],
  required_disclosures: [
    'Location/Timezone',
    'Work authorization status',
    'Internet reliability',
  ],
  privacy_regulations: {
    applicable_laws: ['GDPR (if applicable)', 'CCPA (if applicable)', 'Local data protection laws'],
    data_retention: 'Varies by company policy',
    right_to_withdraw: true,
  },

  is_active: true,
  version: 1,
};
