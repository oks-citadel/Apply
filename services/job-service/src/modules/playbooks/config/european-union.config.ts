import {
  Region,
  ResumeFormat,
  CoverLetterStyle,
  VisaType,
} from '../entities/playbook.entity';

export const europeanUnionPlaybook = {
  region: Region.EUROPEAN_UNION,
  name: 'European Union Professional',
  country: null, // Varies by country
  description: 'General EU application standards, emphasizing the Europass CV format, multilingual capabilities, and GDPR compliance. Note: Specific country variations may apply.',

  // Resume Configuration
  preferred_resume_format: ResumeFormat.CHRONOLOGICAL,
  resume_max_pages: 2,
  resume_section_order: {
    sections: [
      'personal_information',
      'work_experience',
      'education_training',
      'skills',
      'languages',
    ],
    optional_sections: [
      'additional_information',
      'annexes',
      'publications',
      'projects',
      'conferences',
      'memberships',
    ],
  },
  resume_required_sections: ['personal_information', 'work_experience', 'education_training', 'skills'],
  include_summary_section: false, // Optional in Europass
  include_photo: true, // Common in many EU countries (Germany, France, Spain)
  include_date_of_birth: true, // Often included in EU CVs
  include_marital_status: false, // Less common now due to GDPR
  page_size: 'A4', // 210 x 297 mm standard across EU
  preferred_fonts: ['Arial', 'Calibri', 'Times New Roman', 'Helvetica'],
  recommended_font_size: 11,

  // Cover Letter Configuration
  cover_letter_style: CoverLetterStyle.FORMAL,
  cover_letter_required: true,
  cover_letter_word_count_min: 200,
  cover_letter_word_count_max: 400,
  cover_letter_opening_template: 'Dear [Title] [Surname],\n\nI am writing to express my interest in the [Job Title] position at [Company Name].',
  cover_letter_closing_template: 'I look forward to the opportunity to discuss my application further.\n\nKind regards,\n[Your Name]',

  // Salary Configuration
  salary_norms: {
    currency: 'EUR',
    typical_range_min: 30000,
    typical_range_max: 90000,
    negotiation_culture: 'conservative',
    salary_discussion_timing: 'after_offer',
    benefits_importance: 'high',
  },
  include_salary_expectations: false,
  common_benefits: [
    'Health Insurance (varies by country)',
    'Pension/Retirement Plan',
    'Annual Leave (minimum 20-25 days)',
    'Sick Leave',
    'Parental Leave',
    'Public Transport Allowance',
    'Meal Vouchers',
    'Professional Development',
    'Remote Work Options',
    '13th/14th Month Salary (in some countries)',
  ],

  // ATS Systems Common in Region
  common_ats_systems: [
    'SAP SuccessFactors',
    'Workday',
    'Oracle HCM',
    'Personio',
    'SmartRecruiters',
    'Greenhouse',
    'Taleo',
    'Bullhorn',
  ],
  ats_optimization_tips: {
    keywords: 'Use keywords in local language and English',
    formatting: 'Consider using Europass CV format for maximum compatibility',
    file_format: 'PDF preferred',
    section_headers: 'Use Europass-standard or clear local language headers',
    bullet_points: 'Quantify achievements with specific metrics',
    skills_section: 'Use Common European Framework (A1-C2) for language skills',
  },

  // Hiring Timeline
  hiring_timeline: {
    typical_response_days: 21,
    typical_interview_rounds: 2,
    typical_total_process_days: 60,
    follow_up_acceptable: true,
    follow_up_days: 14,
  },

  // Visa and Work Authorization
  visa_requirements: VisaType.EU_CITIZEN_ONLY,
  visa_information: 'EU citizens have freedom of movement within the EU. Non-EU citizens need work permits (Blue Card, national work permits). Post-Brexit, UK citizens need authorization.',
  ask_work_authorization: true,
  acceptable_work_permits: [
    'EU Citizen',
    'EEA Citizen',
    'Swiss Citizen',
    'EU Blue Card',
    'National Work Permit',
    'Permanent Residence Permit',
    'Refugee Protection',
    'Family Reunification Permit',
  ],

  // Cultural Preferences
  cultural_preferences: {
    formality_level: 'formal',
    communication_style: 'indirect',
    emphasis_on_education: 'very_high',
    emphasis_on_experience: 'high',
    value_job_hopping: false,
    preferred_references: 'optional',
    photo_on_resume: 'common',
    age_disclosure: 'common',
  },
  interview_tips: [
    'Formality varies by country - research local norms',
    'In Germany/Netherlands: be direct and punctual',
    'In France/Italy/Spain: expect longer interview process',
    'Language skills are highly valued - mention proficiency levels',
    'Prepare to discuss salary expectations (varies by country)',
    'Dress formally and conservatively',
    'Be prepared for multiple interview rounds',
    'Understand local business etiquette and hierarchy',
    'Send thank-you note after interview (email acceptable)',
  ],
  common_interview_formats: [
    'phone_screen',
    'video',
    'in_person',
    'panel',
    'assessment_centre',
    'competency_based',
  ],

  // Language Requirements
  primary_language: 'en',
  acceptable_languages: [
    'en',
    'de', // German
    'fr', // French
    'es', // Spanish
    'it', // Italian
    'nl', // Dutch
    'pt', // Portuguese
    'pl', // Polish
    'sv', // Swedish
    'da', // Danish
    'fi', // Finnish
  ],
  require_language_certification: true,

  // Application Best Practices
  application_dos: [
    'Consider using Europass CV format for standardization',
    'Include professional photo (headshot, neutral background)',
    'List language skills using CEFR levels (A1-C2)',
    'Tailor CV to local language and culture',
    'Include date of birth and nationality if customary',
    'State availability and notice period',
    'Mention willingness to relocate if applicable',
    'Use reverse chronological order',
    'Include all relevant qualifications and certifications',
    'Translate documents if applying in non-native language',
  ],
  application_donts: [
    'Don\'t send generic Europass CV without customization',
    'Don\'t omit language skills (critical in EU)',
    'Don\'t include irrelevant personal information',
    'Don\'t use informal language',
    'Don\'t forget to localize date formats (DD/MM/YYYY)',
    'Don\'t exaggerate qualifications',
    'Don\'t ignore country-specific application norms',
    'Don\'t use casual email addresses',
    'Don\'t exceed 2-3 pages for CV',
    'Don\'t forget GDPR consent statement',
  ],
  special_considerations: 'GDPR compliance is mandatory. Include consent for data processing. Educational credentials may need recognition/equivalency verification (NARIC). Country-specific variations apply (e.g., German "Bewerbungsmappe", French "Lettre de motivation").',

  // Legal and Compliance
  protected_characteristics: [
    'Age (varies by country)',
    'Race or Ethnic Origin',
    'Religion or Belief',
    'Disability',
    'Sexual Orientation',
    'Sex',
    'Gender Identity (varies by country)',
  ],
  required_disclosures: [
    'GDPR data processing consent',
  ],
  privacy_regulations: {
    applicable_laws: ['GDPR (General Data Protection Regulation)', 'National Data Protection Laws'],
    data_retention: 'Must be clearly stated; typically 6-12 months',
    right_to_withdraw: true,
  },

  is_active: true,
  version: 1,
};
