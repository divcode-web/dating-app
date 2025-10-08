/**
 * Input sanitization utilities for API security
 */

/**
 * Sanitize string input by removing potential XSS vectors
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .substring(0, 10000); // Limit length to prevent DoS
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';

  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: any, min?: number, max?: number): number | null {
  const num = Number(input);

  if (isNaN(num) || !isFinite(num)) return null;

  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;

  return num;
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') return input;
  if (input === 'true' || input === '1' || input === 1) return true;
  return false;
}

/**
 * Sanitize array input
 */
export function sanitizeArray<T>(
  input: any,
  sanitizeItem: (item: any) => T,
  maxLength: number = 100
): T[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, maxLength)
    .map(sanitizeItem)
    .filter(item => item !== null && item !== undefined);
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Validate and sanitize UUID
 */
export function sanitizeUUID(uuid: string): string {
  if (typeof uuid !== 'string') return '';

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid) ? uuid.toLowerCase() : '';
}

/**
 * Sanitize date input
 */
export function sanitizeDate(date: string): string | null {
  if (typeof date !== 'string') return null;

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: any,
  allowedKeys: string[]
): Partial<T> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return {};
  }

  const sanitized: any = {};

  for (const key of allowedKeys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue; // Prevent prototype pollution
    }

    if (key in obj) {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}
