import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert relative image URLs to absolute URLs pointing to the backend
 */
export function getImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return '';
  
  // If already an absolute URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // For Next.js, images are served from the same domain
  // If it's a relative URL starting with /storage, use it directly
  if (imageUrl.startsWith('/storage/') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // For any other relative path, prepend /
  return `/${imageUrl}`;
}
