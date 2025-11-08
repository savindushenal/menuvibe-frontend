/**
 * Utility for making authenticated requests to Next.js API routes
 * Uses the JWT token stored in localStorage
 */

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Make an authenticated fetch request to a Next.js API route
 */
export async function authenticatedFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('next_jwt_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json();
  return data;
}

/**
 * Store the Next.js JWT token
 */
export function setNextJwtToken(token: string | null) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('next_jwt_token', token);
    } else {
      localStorage.removeItem('next_jwt_token');
    }
  }
}

/**
 * Get the Next.js JWT token
 */
export function getNextJwtToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('next_jwt_token');
  }
  return null;
}
