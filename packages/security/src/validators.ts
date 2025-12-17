export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  // More strict email regex that:
  // - Disallows consecutive dots
  // - Requires proper TLD (at least 2 chars after last dot)
  // - Disallows dangerous characters like < > "
  const emailRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

  if (!email) {
    errors.push("Email is required");
  } else if (email.length > 255) {
    errors.push("Email must be less than 255 characters");
  } else if (/[<>"']/.test(email) || /\s/.test(email)) {
    // Reject dangerous characters and whitespace
    errors.push("Invalid email format");
  } else if (/\.\./.test(email)) {
    // Reject consecutive dots
    errors.push("Invalid email format");
  } else if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (password.length > 128) {
      errors.push("Password must be less than 128 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      errors.push("URL must use http or https protocol");
    }
  } catch {
    errors.push("Invalid URL format");
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];
  // E.164 format regex - requires + at the start and 10-15 digits
  const phoneRegex = /^\+[1-9]\d{9,14}$/;

  if (!phone) {
    return { isValid: true, errors: [] }; // Phone is optional
  }

  const cleanPhone = phone.replace(/[\s\-().]/g, "");

  if (!phoneRegex.test(cleanPhone)) {
    errors.push("Invalid phone number format");
  }

  return { isValid: errors.length === 0, errors };
}

export function validateFileType(
  fileName: string,
  allowedTypes: string[]
): ValidationResult {
  const errors: string[] = [];
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (!ext || !allowedTypes.includes(ext)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`);
  }

  return { isValid: errors.length === 0, errors };
}

export function validateFileSize(
  sizeInBytes: number,
  maxSizeInMB: number
): ValidationResult {
  const errors: string[] = [];
  const maxBytes = maxSizeInMB * 1024 * 1024;

  if (sizeInBytes > maxBytes) {
    errors.push(`File size exceeds maximum allowed size of ${maxSizeInMB}MB`);
  }

  return { isValid: errors.length === 0, errors };
}

export function validateUUID(uuid: string): ValidationResult {
  const errors: string[] = [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid) {
    errors.push("UUID is required");
  } else if (!uuidRegex.test(uuid)) {
    errors.push("Invalid UUID format");
  }

  return { isValid: errors.length === 0, errors };
}

export function validateDateRange(
  startDate: Date,
  endDate: Date
): ValidationResult {
  const errors: string[] = [];

  if (startDate > endDate) {
    errors.push("Start date must be before end date");
  }

  return { isValid: errors.length === 0, errors };
}

export function sanitizeAndValidate<T extends Record<string, unknown>>(
  data: T,
  validators: Record<keyof T, (value: unknown) => ValidationResult>
): { isValid: boolean; errors: Record<string, string[]>; data: T } {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const [key, validator] of Object.entries(validators)) {
    const result = validator(data[key as keyof T]);
    if (!result.isValid) {
      isValid = false;
      errors[key] = result.errors;
    }
  }

  return { isValid, errors, data };
}
