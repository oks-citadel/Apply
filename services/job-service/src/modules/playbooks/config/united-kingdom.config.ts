import {
  Region,
  ResumeFormat,
  CoverLetterStyle,
  VisaType,
} from '../entities/playbook.entity';

export const unitedKingdomPlaybook = {
  region: Region.UNITED_KINGDOM,
  name: 'United Kingdom Professional',
  country: 'United Kingdom',
  description: 'British CV and application standards, emphasizing concise CVs (Curriculum Vitae), formal cover letters, and professional references.',

  // Resume Configuration (Called CV in UK)
  preferred_resume_format: ResumeFormat.CHRONOLOGICAL,
  resume_max_pages: 2,
  resume_section_order: {
    sections: [
      'personal_details',
      'personal_statement',
      'work_experience',
      'education',
      'skills',
      'references',
    ],
    optional_sections: ['achievements', 'interests', 'publications', 'professional_memberships'],
  },
  resume_required_sections: ['personal_details', 'work_experience', 'education', 'references'],
  include_summary_section: true, // Called "Personal Statement" in UK
  include_photo: false,
  include_date_of_birth: false,
  include_marital_status: false,
  page_size: 'A4', // 210 x 297 mm
  preferred_fonts: ['Arial', 'Calibri', 'Times New Roman', 'Georgia'],
  recommended_font_size: 11,

  // Cover Letter Configuration
  cover_letter_style: CoverLetterStyle.FORMAL,
  cover_letter_required: true,
  cover_letter_word_count_min: 250,
  cover_letter_word_count_max: 400,
  cover_letter_opening_template: 'Dear [Hiring Manager Name/Sir or Madam],\n\nI am writing to apply for the position of [Job Title] at [Company Name], as advertised on [Platform].',
  cover_letter_closing_template: 'Thank you for considering my application. I look forward to the opportunity to discuss my suitability for this role.\n\nYours sincerely,\n[Your Name]',

  // Salary Configuration
  salary_norms: {
    currency: 'GBP',
    typical_range_min: 25000,
    typical_range_max: 80000,
    negotiation_culture: 'conservative',
    salary_discussion_timing: 'after_offer',
    benefits_importance: 'medium',
  },
  include_salary_expectations: false,
  common_benefits: [
    'NHS (National Health Service)',
    'Pension Scheme',
    'Holiday Entitlement (28 days statutory minimum)',
    'Sick Pay',
    'Maternity/Paternity Leave',
    'Life Assurance',
    'Private Medical Insurance (optional)',
    'Season Ticket Loan',
    'Cycle to Work Scheme',
    'Flexible Working',
    'Professional Development',
  ],

  // ATS Systems Common in Region
  common_ats_systems: [
    'Workday',
    'Greenhouse',
    'Taleo',
    'Bullhorn',
    'SmartRecruiters',
    'Jobvite',
    'iCIMS',
    'Oracle HCM',
  ],
  ats_optimization_tips: {
    keywords: 'Use British English spelling and terminology',
    formatting: 'Simple, professional formatting - avoid tables and graphics',
    file_format: 'PDF or Word document',
    section_headers: 'Use UK-standard headers (Personal Details, Work Experience, etc.)',
    bullet_points: 'Focus on achievements and responsibilities',
    skills_section: 'Include both technical and soft skills',
  },

  // Hiring Timeline
  hiring_timeline: {
    typical_response_days: 21,
    typical_interview_rounds: 2,
    typical_total_process_days: 45,
    follow_up_acceptable: true,
    follow_up_days: 14,
  },

  // Visa and Work Authorization
  visa_requirements: VisaType.WORK_PERMIT_REQUIRED,
  visa_information: 'Post-Brexit, EU citizens need work authorization. Common visa routes: Skilled Worker Visa, Graduate Visa, Global Talent Visa. Right to Work in UK must be proven.',
  ask_work_authorization: true,
  acceptable_work_permits: [
    'British Citizen',
    'Indefinite Leave to Remain',
    'Settled Status (EU Settlement Scheme)',
    'Pre-Settled Status',
    'Skilled Worker Visa',
    'Graduate Visa',
    'Global Talent Visa',
    'Youth Mobility Visa',
  ],

  // Cultural Preferences
  cultural_preferences: {
    formality_level: 'formal',
    communication_style: 'indirect',
    emphasis_on_education: 'high',
    emphasis_on_experience: 'high',
    value_job_hopping: false,
    preferred_references: 'required',
    photo_on_resume: 'discouraged',
    age_disclosure: 'optional',
  },
  interview_tips: [
    'Address interviewer by title and surname unless invited to use first name',
    'Dress formally - business attire is standard',
    'Arrive 10-15 minutes early',
    'Prepare detailed examples of past work experiences',
    'Be modest but confident - avoid overt self-promotion',
    'References are expected - prepare 2 professional references',
    'Send a thank-you email after the interview',
    'Be prepared to discuss notice period with current employer',
    'Understand the company culture and values beforehand',
  ],
  common_interview_formats: [
    'phone_screen',
    'video',
    'in_person',
    'panel',
    'competency_based',
    'assessment_centre',
  ],

  // Language Requirements
  primary_language: 'en',
  acceptable_languages: ['en'],
  require_language_certification: false,

  // Application Best Practices
  application_dos: [
    'Use British English spelling (colour, organisation, etc.)',
    'Include "References available upon request" or provide 2 references',
    'Tailor your CV and cover letter to each application',
    'Use clear section headings and reverse chronological order',
    'Include National Insurance number if requested (not on CV)',
    'State your notice period if currently employed',
    'Mention right to work in UK clearly',
    'Keep CV to 2 pages (max 3 for senior positions)',
    'Use professional email address',
    'Proofread carefully for spelling and grammar',
  ],
  application_donts: [
    'Don\'t use American spelling or terminology',
    'Don\'t include photo unless specifically requested (e.g., acting, modeling)',
    'Don\'t include age, date of birth, or marital status',
    'Don\'t include salary expectations unless specifically asked',
    'Don\'t use first name unless invited to do so',
    'Don\'t include National Insurance number on CV',
    'Don\'t exaggerate qualifications or experience',
    'Don\'t send generic applications',
    'Don\'t use informal language or slang',
    'Don\'t include irrelevant hobbies or interests',
  ],
  special_considerations: 'Equality Act 2010 protects against discrimination. Right to Work checks are mandatory - employers must verify eligibility before employment.',

  // Legal and Compliance
  protected_characteristics: [
    'Age',
    'Disability',
    'Gender Reassignment',
    'Marriage and Civil Partnership',
    'Pregnancy and Maternity',
    'Race',
    'Religion or Belief',
    'Sex',
    'Sexual Orientation',
  ],
  required_disclosures: [],
  privacy_regulations: {
    applicable_laws: ['UK GDPR', 'Data Protection Act 2018'],
    data_retention: 'Application data typically retained for 6-12 months',
    right_to_withdraw: true,
  },

  is_active: true,
  version: 1,
};
