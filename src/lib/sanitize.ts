/**
 * Content sanitization utilities for XSS prevention
 *
 * Sanitizes user-generated content before display to prevent
 * cross-site scripting (XSS) attacks.
 */

/**
 * HTML entity map for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param str String to sanitize
 * @returns Escaped string safe for HTML display
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a URL to prevent javascript: and data: URIs
 *
 * @param url URL to sanitize
 * @returns Safe URL or empty string if potentially dangerous
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }

  return url;
}

/**
 * Sanitize message content for safe display
 *
 * This function escapes HTML entities while preserving whitespace
 * for proper message formatting (newlines, etc.)
 *
 * @param content Message content to sanitize
 * @returns Sanitized content safe for display
 */
export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') return '';

  // Escape HTML entities
  return escapeHtml(content);
}

/**
 * Sanitize an object's string properties recursively
 *
 * @param obj Object to sanitize
 * @param keysToSanitize Keys to sanitize (defaults to common content keys)
 * @returns Object with sanitized string properties
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  keysToSanitize: string[] = ['content', 'message', 'text', 'body', 'name']
): T {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };

  for (const key of Object.keys(result)) {
    const value = result[key];

    if (typeof value === 'string' && keysToSanitize.includes(key)) {
      (result as Record<string, unknown>)[key] = sanitizeMessageContent(value);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, keysToSanitize)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>,
        keysToSanitize
      );
    }
  }

  return result;
}
