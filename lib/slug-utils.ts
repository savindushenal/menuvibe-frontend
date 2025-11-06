/**
 * Client-safe slug utilities (no database dependencies)
 * These can be used in both client and server components
 */

/**
 * Generate a URL-safe slug from text
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, 'and')        // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

/**
 * Generate a random unique ID (8 characters)
 */
export function generatePublicId(length: number = 8): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Parse slug to extract public_id
 * Slug format: {location-name}-{menu-name}-{public-id}
 * Public ID is always the last segment (8 chars)
 */
export function extractPublicIdFromSlug(slug: string): string | null {
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  // Public ID should be 8 alphanumeric characters
  if (lastPart && /^[a-z0-9]{8}$/.test(lastPart)) {
    return lastPart;
  }
  
  return null;
}

/**
 * Validate if a slug is properly formatted
 */
export function isValidSlug(slug: string): boolean {
  // Must be lowercase alphanumeric with hyphens
  // Must contain at least 3 segments (location-menu-id)
  const isValidFormat = /^[a-z0-9]+(-[a-z0-9]+){2,}$/.test(slug);
  const hasPublicId = extractPublicIdFromSlug(slug) !== null;
  
  return isValidFormat && hasPublicId;
}
