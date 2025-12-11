import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import crypto from 'crypto';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
}

/**
 * Validate Laravel Sanctum token and get the authenticated user
 * Sanctum tokens are stored as SHA256 hashes in the database
 * Token format: "id|plainTextToken"
 */
export async function getUserFromToken(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Sanctum tokens have format: "id|plainTextToken"
    // We need to hash the plain text part and look it up in the database
    const [tokenId, plainTextToken] = token.includes('|') 
      ? token.split('|', 2) 
      : [null, token];

    if (!plainTextToken) {
      console.error('Invalid token format - no plain text token found');
      return null;
    }

    // Hash the token the same way Laravel Sanctum does
    const hashedToken = crypto.createHash('sha256').update(plainTextToken).digest('hex');

    // Look up the token in the personal_access_tokens table
    // If token has ID prefix, use it for faster lookup
    let tokenQuery: string;
    let tokenParams: any[];

    if (tokenId) {
      tokenQuery = `
        SELECT pat.tokenable_id, pat.abilities 
        FROM personal_access_tokens pat 
        WHERE pat.id = ? AND pat.token = ? AND pat.tokenable_type = 'App\\\\Models\\\\User'
      `;
      tokenParams = [tokenId, hashedToken];
    } else {
      tokenQuery = `
        SELECT pat.tokenable_id, pat.abilities 
        FROM personal_access_tokens pat 
        WHERE pat.token = ? AND pat.tokenable_type = 'App\\\\Models\\\\User'
      `;
      tokenParams = [hashedToken];
    }

    const tokenRecord = await queryOne<{ tokenable_id: number; abilities: string }>(tokenQuery, tokenParams);

    if (!tokenRecord) {
      console.error('Token not found in database');
      return null;
    }

    // Get the user associated with this token
    const user = await queryOne<AuthUser>(
      'SELECT id, name, email, phone FROM users WHERE id = ?',
      [tokenRecord.tokenable_id]
    );

    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json(
    { success: false, message: 'Unauthenticated' },
    { status: 401 }
  );
}
