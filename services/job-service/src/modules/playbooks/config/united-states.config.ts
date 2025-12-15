import {
  Region,
  ResumeFormat,
  CoverLetterStyle,
  VisaType,
} from '../entities/playbook.entity';

export const unitedStatesPlaybook = {
  region: Region.UNITED_STATES,
  name: 'United States Professional',
  country: 'United States',
  description: 'Standard playbook for job applications in the United States, emphasizing ATS optimization and achievement-based resumes.',

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
      'certifications',
    ],
    optional_sections: ['volunteer', 'publications', 'awards', 'projects'],
  },
  resume_required_sections: ['contact', 'experience', 'education', 'skills'],
  include_summary_section: true,
  include_photo: false,
  include_date_of_birth: false,
  include_marital_status: false,
  page_size: 'letter', // 8.5 x 11 inches
  preferred_fonts: ['Arial', 'Calibri', 'Helvetica', 'Times New Roman'],
  recommended_font_size: 11,

  // Cover Letter Configuration
  cover_letter_style: CoverLetterStyle.FORMAL,
  cover_letter_required: true,
  cover_letter_word_count_min: 250,
  cover_letter_word_count_max: 400,
  cover_letter_opening_template: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the [Job Title] position at [Company Name].',
  cover_letter_closing_template: 'Thank you for considering my application. I look forward to discussing how my experience and skills align with your team\'s needs.\n\nSincerely,\n[Your Name]',

  // Salary Configuration
  salary_norms: {
    currency: 'USD',
    typical_range_min: 50000,
    typical_range_max: 150000,
    negotiation_culture: 'moderate',
    salary_discussion_timing: 'mid_process',
    benefits_importance: 'high',
  },
  include_salary_expectations: false, // Usually not included in initial application
  common_benefits: [
    'Health Insurance (Medical, Dental, Vision)',
    '401(k) with company match',
    'Paid Time Off (PTO)',
    'Paid Sick Leave',
    'Life Insurance',
    'Disability Insurance',
    'Professional Development',
    'Remote Work Options',
    'Flexible Schedule',
    'Stock Options/RSUs',
  ],

  // ATS Systems Common in Region
  common_ats_systems: [
    'Workday',
    'Greenhouse',
    'Lever',
    'Taleo',
    'iCIMS',
    'SuccessFactors',
    'ADP',
    'BambooHR',
    'JazzHR',
    'SmartRecruiters',
  ],
  ats_optimization_tips: {
    keywords: 'Use exact keywords from job description',
    formatting: 'Avoid tables, headers/footers, and complex formatting',
    file_format: 'PDF or DOCX preferred',
    section_headers: 'Use standard section headers (Experience, Education, etc.)',
    bullet_points: 'Start with action verbs, quantify achievements',
    skills_section: 'List both hard and soft skills matching job requirements',
  },

  // Hiring Timeline
  hiring_timeline: {
    typical_response_days: 14,
    typical_interview_rounds: 3,
    typical_total_process_days: 45,
    follow_up_acceptable: true,
    follow_up_days: 7,
  },

  // Visa and Work Authorization
  visa_requirements: VisaType.WORK_PERMIT_REQUIRED,
  visa_information: 'Most positions require US work authorization. Common visa types: H-1B, L-1, TN (NAFTA), OPT/CPT for students. Green card holders and US citizens preferred.',
  ask_work_authorization: true,
  acceptable_work_permits: [
    'US Citizen',
    'Green Card Holder',
    'H-1B',
    'L-1',
    'TN Visa',
    'EAD (Employment Authorization Document)',
    'OPT',
    'CPT',
  ],

  // Cultural Preferences
  cultural_preferences: {
    formality_level: 'neutral',
    communication_style: 'direct',
    emphasis_on_education: 'medium',
    emphasis_on_experience: 'high',
    value_job_hopping: false,
    preferred_references: 'optional',
    photo_on_resume: 'discouraged',
    age_disclosure: 'illegal',
  },
  interview_tips: [
    'Research the company thoroughly before the interview',
    'Prepare STAR method responses (Situation, Task, Action, Result)',
    'Dress professionally (business or business casual depending on industry)',
    'Arrive 10-15 minutes early for in-person interviews',
    'Send a thank-you email within 24 hours after the interview',
    'Be prepared to discuss salary expectations in later rounds',
    'Ask thoughtful questions about the role and company culture',
    'Emphasize quantifiable achievements and impact',
  ],
  common_interview_formats: [
    'phone_screen',
    'video',
    'in_person',
    'panel',
    'technical',
    'behavioral',
    'case_study',
  ],

  // Language Requirements
  primary_language: 'en',
  acceptable_languages: ['en'],
  require_language_certification: false,

  // Application Best Practices
  application_dos: [
    'Tailor your resume and cover letter to each specific job',
    'Use action verbs and quantify achievements with metrics',
    'Include relevant keywords from the job description',
    'Proofread thoroughly for grammar and spelling errors',
    'Use a professional email address',
    'Keep resume to 1-2 pages maximum',
    'List most recent experience first (reverse chronological)',
    'Include LinkedIn profile if it\'s current and professional',
    'Use consistent formatting and fonts throughout',
    'Save as PDF unless otherwise specified',
  ],
  application_donts: [
    'Don\'t include photo, age, marital status, or other protected characteristics',
    'Don\'t use generic, one-size-fits-all resumes',
    'Don\'t include references unless specifically requested',
    'Don\'t use unprofessional email addresses',
    'Don\'t include irrelevant work experience from 15+ years ago',
    'Don\'t exaggerate or lie about qualifications',
    'Don\'t use fancy fonts, colors, or graphics (unless in creative field)',
    'Don\'t include salary requirements unless specifically asked',
    'Don\'t submit without proofreading',
    'Don\'t use "I" or "me" in resume bullet points',
  ],
  special_considerations: 'Equal Employment Opportunity (EEO) laws prohibit discrimination. Do not include age, race, religion, gender, disability status, or other protected characteristics.',

  // Legal and Compliance
  protected_characteristics: [
    'Age',
    'Race',
    'Religion',
    'Gender',
    'National Origin',
    'Disability Status',
    'Marital Status',
    'Sexual Orientation',
    'Pregnancy Status',
    'Genetic Information',
  ],
  required_disclosures: [],
  privacy_regulations: {
    applicable_laws: ['CCPA (California Consumer Privacy Act)'],
    data_retention: 'Application materials typically retained for 1-2 years',
    right_to_withdraw: true,
  },

  is_active: true,
  version: 1,
};
