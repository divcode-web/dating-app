/**
 * Password security utilities for enhanced authentication protection
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxLength?: number;
}

/**
 * Default password requirements based on user specifications:
 * - 8+ characters minimum
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: false, // Not required per user request
  maxLength: 128,
};

/**
 * Common weak passwords to reject
 */
const COMMON_WEAK_PASSWORDS = [
  'password', 'password123', '123456', '123456789', 'qwerty',
  'abc123', 'password1', 'admin', 'letmein', 'welcome',
  'monkey', 'dragon', 'password12', 'password123', 'iloveyou'
];

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check if password is provided
  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
      score: 0,
    };
  }

  // Check length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  } else {
    score += 10;
  }

  if (requirements.maxLength && password.length > requirements.maxLength) {
    errors.push(`Password must not exceed ${requirements.maxLength} characters`);
  }

  // Check for common weak passwords
  if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('This password is too common and easily guessable');
    score = Math.max(score - 20, 0);
  }

  // Check character requirements
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (requirements.requireUppercase) {
    score += 15;
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (requirements.requireLowercase) {
    score += 15;
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (requirements.requireNumbers) {
    score += 15;
  }

  if (requirements.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (requirements.requireSymbols) {
    score += 15;
  }

  // Check for repeated characters (more than 3 in a row)
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
    score = Math.max(score - 10, 0);
  }

  // Check for sequential characters (like '123', 'abc')
  if (/123456|abcdef|qwerty|asdfgh/i.test(password)) {
    errors.push('Password should not contain sequential characters');
    score = Math.max(score - 10, 0);
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
  if (score >= 70) {
    strength = 'very-strong';
  } else if (score >= 50) {
    strength = 'strong';
  } else if (score >= 30) {
    strength = 'medium';
  }

  // Bonus points for length
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.min(score, 100),
  };
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case 'very-strong':
      return 'text-green-600';
    case 'strong':
      return 'text-blue-600';
    case 'medium':
      return 'text-yellow-600';
    case 'weak':
    default:
      return 'text-red-600';
  }
}

/**
 * Get password strength text for UI
 */
export function getPasswordStrengthText(strength: string): string {
  switch (strength) {
    case 'very-strong':
      return 'Very Strong';
    case 'strong':
      return 'Strong';
    case 'medium':
      return 'Medium';
    case 'weak':
    default:
      return 'Weak';
  }
}

/**
 * Generate a secure password suggestion
 */
export function generatePasswordSuggestion(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  let chars = lowercase + uppercase + numbers;
  let password = '';

  // Ensure at least one character from each required set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // Fill the rest randomly
  for (let i = 3; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password has been compromised (basic check)
 * In production, you would integrate with HaveIBeenPwned API
 */
export async function checkPasswordCompromised(password: string): Promise<boolean> {
  // This is a basic implementation
  // In production, integrate with HaveIBeenPwned API or similar service
  const hash = await hashPassword(password);
  const prefix = hash.substring(0, 5);

  try {
    // This would make an API call to a breach checking service
    // For now, we'll just return false (not compromised)
    return false;
  } catch (error) {
    console.error('Error checking password compromise:', error);
    return false;
  }
}

/**
 * Simple password hashing (for demonstration)
 * In production, never implement your own crypto
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}