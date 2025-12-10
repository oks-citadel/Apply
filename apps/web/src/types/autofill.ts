export interface AutofillField {
  id: string;
  fieldName: string;
  fieldType: 'text' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'number';
  value: string;
  originalValue?: string;
  confidence: number;
  source: 'resume' | 'profile' | 'saved_answer' | 'ai_generated' | 'manual';
  resumeVersion?: string;
  isEdited: boolean;
  isConflict: boolean;
  conflictingValues?: ConflictingValue[];
  validationErrors?: string[];
  required: boolean;
}

export interface ConflictingValue {
  value: string;
  source: 'resume' | 'profile' | 'saved_answer';
  confidence: number;
  resumeVersion?: string;
}

export interface AutofillReview {
  id: string;
  applicationId: string;
  jobTitle: string;
  company: string;
  fields: AutofillField[];
  lowConfidenceFields: AutofillField[];
  missingRequiredFields: string[];
  conflictingFields: AutofillField[];
  overallConfidence: number;
  resumeVersionUsed: string;
  createdAt: string;
  status: 'pending_review' | 'approved' | 'edited' | 'rejected';
}

export interface TimelineEntry {
  id: string;
  type: 'job' | 'education' | 'project' | 'gap';
  title: string;
  organization?: string;
  startDate: Date;
  endDate?: Date;
  current?: boolean;
  description?: string;
  hasOverlap?: boolean;
  overlapsWith?: string[];
  hasGap?: boolean;
  gapDuration?: number;
}

export interface SavedAnswer {
  id: string;
  category: 'citizenship' | 'sponsorship' | 'salary' | 'availability' | 'relocation' | 'experience' | 'custom';
  question: string;
  answer: string;
  isDefault: boolean;
  usageCount: number;
  lastUsed?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AutofillError {
  id: string;
  fieldName: string;
  detectedValue: string;
  correctValue: string;
  errorType: 'wrong_format' | 'wrong_data' | 'missing_data' | 'validation_error';
  suggestion?: string;
  applicationId: string;
  createdAt: string;
}

export interface AutofillLearningMetrics {
  accuracy: {
    overall: number;
    byFieldType: Record<string, number>;
    trend: TrendData[];
  };
  errorCorrections: {
    total: number;
    byType: Record<string, number>;
    recent: AutofillError[];
  };
  atsCompatibility: {
    score: number;
    successfulSubmissions: number;
    failedSubmissions: number;
    compatibilityByPlatform: Record<string, number>;
  };
  profileCompleteness: {
    percentage: number;
    missingFields: string[];
    suggestions: string[];
  };
  improvements: {
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: 'accuracy' | 'speed' | 'completeness' | 'compatibility';
  }[];
}

export interface TrendData {
  date: string;
  value: number;
}

export interface FieldCorrection {
  fieldName: string;
  oldValue: string;
  newValue: string;
  formatSuggestion?: string;
}
