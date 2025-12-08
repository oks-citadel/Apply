export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validators = {
  email: (value: string): string | undefined => {
    if (!value) return 'Email is required';
    if (!emailRegex.test(value)) return 'Invalid email format';
    return undefined;
  },

  password: (value: string, minLength: number = 8): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < minLength)
      return `Password must be at least ${minLength} characters`;
    return undefined;
  },

  confirmPassword: (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return undefined;
  },

  required: (value: string, fieldName: string): string | undefined => {
    if (!value || !value.trim()) return `${fieldName} is required`;
    return undefined;
  },

  minLength: (value: string, min: number, fieldName: string): string | undefined => {
    if (value.length < min)
      return `${fieldName} must be at least ${min} characters`;
    return undefined;
  },

  maxLength: (value: string, max: number, fieldName: string): string | undefined => {
    if (value.length > max)
      return `${fieldName} must be at most ${max} characters`;
    return undefined;
  },
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ((value: any) => string | undefined)[]>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const fieldRules = rules[field];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });

  return errors;
};
