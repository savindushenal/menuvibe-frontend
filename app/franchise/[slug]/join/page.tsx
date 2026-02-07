'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Building2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface InvitationDetails {
  franchise_name: string;
  role: string;
  inviter_name: string;
  email: string;
  is_existing_user: boolean;
}

export default function JoinFranchisePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    validateInvitation();
  }, [slug, email, token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/franchise-invitations/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          email,
          token,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Invalid or expired invitation');
        return;
      }

      setInvitation(data.data);
    } catch (err) {
      setError('Failed to validate invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation?.is_existing_user && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!invitation?.is_existing_user && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setAccepting(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/franchise-invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          email,
          token,
          password: invitation?.is_existing_user ? undefined : password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to accept invitation');
        return;
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login?email=' + encodeURIComponent(email || ''));
      }, 2000);
    } catch (err) {
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const formatRole = (role: string) => {
    const roleNames: Record<string, string> = {
      'franchise_admin': 'Franchise Admin',
      'branch_manager': 'Branch Manager',
      'staff': 'Staff',
      'owner': 'Owner',
      'admin': 'Admin',
      'manager': 'Manager',
    };
    return roleNames[role] || role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invitation Invalid</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/auth/login')} variant="outline">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <CardTitle className="text-emerald-600">Welcome to the Team!</CardTitle>
            <CardDescription>
              Your invitation has been accepted. Redirecting you to login...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle>Join {invitation?.franchise_name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited by <strong>{invitation?.inviter_name}</strong> to join as a <strong>{formatRole(invitation?.role || '')}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            {!invitation?.is_existing_user && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </>
            )}

            {invitation?.is_existing_user && (
              <Alert className="bg-emerald-50 border-emerald-200">
                <AlertDescription className="text-emerald-800">
                  You already have a MenuVire account. Click accept to add this franchise to your account.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                'Accept Invitation'
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-4">
              By accepting this invitation, you agree to MenuVire&apos;s Terms of Service and Privacy Policy.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
