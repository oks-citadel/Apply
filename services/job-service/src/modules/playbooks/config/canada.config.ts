import {
  Region,
  ResumeFormat,
  CoverLetterStyle,
  VisaType,
} from '../entities/playbook.entity';

export const canadaPlaybook = {
  region: Region.CANADA,
  name: 'Canada Professional',
  country: 'Canada',
  description: 'Tailored playbook for Canadian job market, emphasizing bilingual capabilities (English/French in certain provinces) and diverse, inclusive hiring practices.',

  // Resume Configuration
  preferred_resume_format: ResumeFormat.CHRONOLOGICAL,
  resume_max_pages: 2,
  resume_section_order: {
    sections: [
      'contact',
      'summary',
      'experience',
      'education',
      'skills',
      'languages',
    ],
    optional_sections: ['certifications', 'volunteer', 'awards', 'publications'],
  },
  resume_required_sections: ['contact', 'experience', 'education', 'skills'],
  include_summary_section: true,
  include_photo: false,
  include_date_of_birth: false,
  include_marital_status: false,
  page_size: 'letter', // 8.5 x 11 inches
  preferred_fonts: ['Arial', 'Calibri', 'Helvetica', 'Georgia'],
  recommended_font_size: 11,

  // Cover Letter Configuration
  cover_letter_style: CoverLetterStyle.FORMAL,
  cover_letter_required: true,
  cover_letter_word_count_min: 250,
  cover_letter_word_count_max: 400,
  cover_letter_opening_template: 'Dear Hiring Manager,\n\nI am writing to apply for the [Job Title] position at [Company Name], as advertised on [Platform].',
  cover_letter_closing_template: 'Thank you for considering my application. I would welcome the opportunity to discuss how my skills and experience can contribute to [Company Name].\n\nSincerely,\n[Your Name]',

  // Salary Configuration
  salary_norms: {
    currency: 'CAD',
    typical_range_min: 45000,
    typical_range_max: 130000,
    negotiation_culture: 'moderate',
    salary_discussion_timing: 'mid_process',
    benefits_importance: 'high',
  },
  include_salary_expectations: false,
  common_benefits: [
    'Extended Health Benefits',
    'Dental Coverage',
    'Vision Care',
    'RRSP Matching',
    'Paid Vacation (minimum 2 weeks)',
    'Sick Leave',
    'Parental Leave',
    'Life Insurance',
    'Disability Insurance',
    'Professional Development',
    'Remote Work Options',
    'Flexible Hours',
  ],

  // ATS Systems Common in Region
  common_ats_systems: [
    'Workday',
    'Greenhouse',
    'Lever',
    'Taleo',
    'iCIMS',
    'BambooHR',
    'ADP',
    'SmartRecruiters',
    'JazzHR',
  ],
  ats_optimization_tips: {
    keywords: 'Include both English and French keywords if applying in Quebec',
    formatting: 'Use simple, clean formatting without tables or graphics',
    file_format: 'PDF preferred',
    section_headers: 'Use standard section headers in English (or French in Quebec)',
    bullet_points: 'Quantify achievements with metrics (CAD for salary/budget figures)',
    skills_section: 'Highlight bilingual skills prominently if applicable',
  },

  // Hiring Timeline
  hiring_timeline: {
    typical_response_days: 14,
    typical_interview_rounds: 3,
    typical_total_process_days: 45,
    follow_up_acceptable: true,
    follow_up_days: 10,
  },

  // Visa and Work Authorization
  visa_requirements: VisaType.WORK_PERMIT_REQUIRED,
  visa_information: 'Work authorization required for non-citizens/permanent residents. Common pathways: Express Entry, Provincial Nominee Program (PNP), LMIA-based work permits, Post-Graduation Work Permit (PGWP).',
  ask_work_authorization: true,
  acceptable_work_permits: [
    'Canadian Citizen',
    'Permanent Resident',
    'Open Work Permit',
    'LMIA Work Permit',
    'PGWP (Post-Graduation Work Permit)',
    'IEC (International Experience Canada)',
    'Spousal Work Permit',
  ],

  // Cultural Preferences
  cultural_preferences: {
    formality_level: 'neutral',
    communication_style: 'balanced',
    emphasis_on_education: 'high',
    emphasis_on_experience: 'high',
    value_job_hopping: false,
    preferred_references: 'required',
    photo_on_resume: 'discouraged',
    age_disclosure: 'illegal',
  },
  interview_tips: [
    'Be polite and professional - Canadians value courtesy',
    'Prepare for behavioral questions using the STAR method',
    'Emphasize teamwork and collaborative skills',
    'Be prepared to provide references (usually 2-3 professional references)',
    'For Quebec positions, bilingual skills (English/French) are highly valued',
    'Arrive 10 minutes early for in-person interviews',
    'Send a thank-you email within 24 hours',
    'Dress professionally, leaning towards business casual',
    'Be honest about salary expectations when asked',
  ],
  common_interview_formats: [
    'phone_screen',
    'video',
    'in_person',
    'panel',
    'behavioral',
    'technical',
  ],

  // Language Requirements
  primary_language: 'en',
  acceptable_languages: ['en', 'fr'],
  require_language_certification: false,

  // Application Best Practices
  application_dos: [
    'Tailor resume and cover letter to the specific job posting',
    'Include language proficiency (especially French for Quebec positions)',
    'Use Canadian spelling and terminology (e.g., "colour" not "color")',
    'Quantify achievements with specific metrics and results',
    'Include relevant Canadian credentials or equivalencies',
    'Mention work authorization status clearly',
    'Prepare professional references in advance (with permission)',
    'Use reverse chronological format for work experience',
    'Keep resume to 2 pages maximum',
    'Include LinkedIn profile if professional and current',
  ],
  application_donts: [
    'Don\'t include photo, age, marital status, or other personal information',
    'Don\'t use US spelling if applying in Canada',
    'Don\'t include salary expectations unless specifically requested',
    'Don\'t submit generic applications without customization',
    'Don\'t list references on resume (provide separately when requested)',
    'Don\'t include social insurance number (SIN)',
    'Don\'t exaggerate qualifications or experience',
    'Don\'t forget to proofread for spelling and grammar',
    'Don\'t use overly casual language',
    'Don\'t include irrelevant work experience from 10+ years ago',
  ],
  special_considerations: 'Canadian Human Rights Act prohibits discrimination based on protected grounds. Quebec has additional French language requirements for many positions.',

  // Legal and Compliance
  protected_characteristics: [
    'Age',
    'Race',
    'National or Ethnic Origin',
    'Religion',
    'Sex',
    'Sexual Orientation',
    'Marital Status',
    'Family Status',
    'Disability',
    'Genetic Characteristics',
    'Pardoned Conviction',
  ],
  required_disclosures: [],
  privacy_regulations: {
    applicable_laws: ['PIPEDA (Personal Information Protection and Electronic Documents Act)', 'Provincial Privacy Laws'],
    data_retention: 'Application materials typically retained for 1-2 years',
    right_to_withdraw: true,
  },

  is_active: true,
  version: 1,
};
