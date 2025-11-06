/**
 * Slug generation utilities for SEO-friendly, unique URLs
 * Server-side only (uses database)
 */

import { queryOne } from './db';
import { slugify, generatePublicId, extractPublicIdFromSlug, isValidSlug } from './slug-utils';

// Re-export client-safe utilities
export { slugify, generatePublicId, extractPublicIdFromSlug, isValidSlug };

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
