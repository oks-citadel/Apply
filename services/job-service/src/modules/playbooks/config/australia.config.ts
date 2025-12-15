import {
  Region,
  ResumeFormat,
  CoverLetterStyle,
  VisaType,
} from '../entities/playbook.entity';

export const australiaPlaybook = {
  region: Region.AUSTRALIA,
  name: 'Australia Professional',
  country: 'Australia',
  description: 'Australian job market standards, emphasizing achievement-based resumes, professional references, and work rights verification.',

  // Resume Configuration
  preferred_resume_format: ResumeFormat.CHRONOLOGICAL,
  resume_max_pages: 3, // Australian CVs can be longer than US resumes
  resume_section_order: {
    sections: [
      'contact_details',
      'career_summary',
      'key_skills',
      'professional_experience',
      'education',
      'certifications',
    ],
    optional_sections: [
      'professional_development',
      'volunteer_work',
      'publications',
      'awards',
      'professional_memberships',
      'referees',
    ],
  },
  resume_required_sections: ['contact_details', 'professional_experience', 'education', 'key_skills'],
  include_summary_section: true, // Called "Career Summary" or "Professional Profile"
  include_photo: false,
  include_date_of_birth: false,
  include_marital_status: false,
  page_size: 'A4', // 210 x 297 mm
  preferred_fonts: ['Arial', 'Calibri', 'Helvetica', 'Times New Roman'],
  recommended_font_size: 11,

  // Cover Letter Configuration
  cover_letter_style: CoverLetterStyle.SEMI_FORMAL,
  cover_letter_required: true,
  cover_letter_word_count_min: 250,
  cover_letter_word_count_max: 400,
  cover_letter_opening_template: 'Dear [Hiring Manager Name],\n\nI am writing to express my strong interest in the [Job Title] position at [Company Name].',
  cover_letter_closing_template: 'Thank you for considering my application. I look forward to discussing how I can contribute to [Company Name].\n\nKind regards,\n[Your Name]',

  // Salary Configuration
  salary_norms: {
    currency: 'AUD',
    typical_range_min: 55000,
    typical_range_max: 140000,
    negotiation_culture: 'moderate',
    salary_discussion_timing: 'mid_process',
    benefits_importance: 'high',
  },
  include_salary_expectations: false,
  common_benefits: [
    'Superannuation (9.5-11% employer contribution)',
    'Annual Leave (4 weeks minimum)',
    'Personal/Sick Leave (10 days minimum)',
    'Long Service Leave',
    'Parental Leave',
    'Salary Packaging',
    'Private Health Insurance',
    'Professional Development',
    'Flexible Working Arrangements',
    'Work from Home Options',
    'Novated Lease',
  ],

  // ATS Systems Common in Region
  common_ats_systems: [
    'SEEK Talent Search',
    'Workday',
    'SAP SuccessFactors',
    'PageUp',
    'SmartRecruiters',
    'Greenhouse',
    'BambooHR',
    'iCIMS',
    'Lever',
  ],
  ats_optimization_tips: {
    keywords: 'Use Australian spelling and terminology',
    formatting: 'Clean, professional formatting - avoid complex layouts',
    file_format: 'PDF or Word document',
    section_headers: 'Use clear, standard headers',
    bullet_points: 'Start with action verbs, include quantifiable achievements',
    skills_section: 'Separate technical and soft skills',
  },

  // Hiring Timeline
  hiring_timeline: {
    typical_response_days: 14,
    typical_interview_rounds: 2,
    typical_total_process_days: 45,
    follow_up_acceptable: true,
    follow_up_days: 10,
  },

  // Visa and Work Authorization
  visa_requirements: VisaType.WORK_PERMIT_REQUIRED,
  visa_information: 'Work rights verification is mandatory. Common visa types: Skilled Worker visas (subclass 482, 186, 189), Working Holiday Visa (417, 462), Graduate Visa (485). Permanent residents and citizens preferred.',
  ask_work_authorization: true,
  acceptable_work_permits: [
    'Australian Citizen',
    'Permanent Resident',
    'Skilled Worker Visa (subclass 482)',
    'Employer Nomination Scheme (subclass 186)',
    'Skilled Independent Visa (subclass 189)',
    'Graduate Visa (subclass 485)',
    'Working Holiday Visa (subclass 417/462)',
    'Bridging Visa with work rights',
  ],

  // Cultural Preferences
  cultural_preferences: {
    formality_level: 'neutral',
    communication_style: 'direct',
    emphasis_on_education: 'high',
    emphasis_on_experience: 'high',
    value_job_hopping: false,
    preferred_references: 'required',
    photo_on_resume: 'discouraged',
    age_disclosure: 'illegal',
  },
  interview_tips: [
    'Australians value directness and honesty - be straightforward',
    'Prepare 2-3 professional references (with permission)',
    'Use the STAR method for behavioral questions',
    'Dress professionally but not overly formal (business casual often acceptable)',
    'Be friendly and personable - cultural fit is important',
    'Arrive 10 minutes early for interviews',
    'Send a thank-you email within 24 hours',
    'Be prepared to discuss salary expectations',
    'Highlight teamwork and collaboration skills',
    'Research the company culture beforehand',
  ],
  common_interview_formats: [
    'phone_screen',
    'video',
    'in_person',
    'panel',
    'behavioral',
    'technical',
    'assessment_centre',
  ],

  // Language Requirements
  primary_language: 'en',
  acceptable_languages: ['en'],
  require_language_certification: false,

  // Application Best Practices
  application_dos: [
    'Use Australian spelling (colour, organisation, etc.)',
    'Include "Referees available upon request" or provide 2-3 references',
    'Tailor CV and cover letter to each position',
    'Clearly state work rights/visa status',
    'Include LinkedIn profile if professional and current',
    'Use reverse chronological order for experience',
    'Quantify achievements with specific metrics',
    'Keep CV to 2-3 pages (3 pages acceptable for senior roles)',
    'Include relevant certifications and licenses',
    'Proofread thoroughly for spelling and grammar',
  ],
  application_donts: [
    'Don\'t include photo unless specifically requested',
    'Don\'t include age, date of birth, or marital status',
    'Don\'t use American spelling',
    'Don\'t include salary expectations unless asked',
    'Don\'t provide references without their permission',
    'Don\'t include TFN (Tax File Number)',
    'Don\'t exaggerate qualifications or experience',
    'Don\'t send generic applications',
    'Don\'t use overly casual language',
    'Don\'t include irrelevant hobbies or personal information',
  ],
  special_considerations: 'Fair Work Act and Anti-Discrimination laws apply. Police checks and Working with Children checks may be required for certain roles. Professional registration required for regulated professions (nursing, teaching, etc.).',

  // Legal and Compliance
  protected_characteristics: [
    'Age',
    'Disability',
    'Race',
    'Sex',
    'Intersex Status',
    'Gender Identity',
    'Sexual Orientation',
    'Marital or Relationship Status',
    'Pregnancy',
    'Breastfeeding',
    'Family Responsibilities',
    'Religion',
    'Political Opinion',
    'National Extraction or Social Origin',
  ],
  required_disclosures: [],
  privacy_regulations: {
    applicable_laws: ['Privacy Act 1988', 'Australian Privacy Principles (APPs)'],
    data_retention: 'Application materials typically retained for 6-12 months',
    right_to_withdraw: true,
  },

  is_active: true,
  version: 1,
};
