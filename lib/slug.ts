/**
 * Slug generation utilities for SEO-friendly, unique URLs
 */

import { queryOne } from './db';

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
 * Generate a unique menu slug
 * Format: {location-name}-{menu-name}-{public-id}
 */
export async function generateMenuSlug(
  menuName: string,
  locationName: string,
  publicId?: string
): Promise<{ slug: string; publicId: string }> {
  // Generate public ID if not provided
  if (!publicId) {
    publicId = generatePublicId(8);
    
    // Ensure public_id is unique
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await queryOne<any>(
        'SELECT id FROM menus WHERE public_id = ?',
        [publicId]
      );
      
      if (!existing) {
        isUnique = true;
      } else {
        publicId = generatePublicId(8);
        attempts++;
      }
    }
  }

  // Create base slug from location + menu name
  const locationSlug = slugify(locationName);
  const menuSlug = slugify(menuName);
  const baseSlug = `${locationSlug}-${menuSlug}-${publicId}`;

  // Ensure slug is unique (should be because of public_id, but double-check)
  const existing = await queryOne<any>(
    'SELECT id FROM menus WHERE slug = ?',
    [baseSlug]
  );

  if (existing) {
    // Extremely rare, but if collision happens, add timestamp
    const timestamp = Date.now().toString(36).slice(-4);
    return {
      slug: `${locationSlug}-${menuSlug}-${publicId}-${timestamp}`,
      publicId,
    };
  }

  return {
    slug: baseSlug,
    publicId,
  };
}

/**
 * Generate slug for a location (for future use)
 */
export async function generateLocationSlug(
  locationName: string,
  city?: string
): Promise<{ slug: string; publicId: string }> {
  const publicId = generatePublicId(8);
  
  const locationSlug = slugify(locationName);
  const citySlug = city ? slugify(city) : '';
  
  const baseSlug = citySlug 
    ? `${locationSlug}-${citySlug}-${publicId}`
    : `${locationSlug}-${publicId}`;

  return {
    slug: baseSlug,
    publicId,
  };
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
