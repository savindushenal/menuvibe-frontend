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
  
  // If it's a relative URL starting with /storage, prepend the backend URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
  
  if (imageUrl.startsWith('/storage/')) {
    return `${backendUrl}${imageUrl}`;
  }
  
  // For any other relative path, prepend backend URL
  return `${backendUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
}
