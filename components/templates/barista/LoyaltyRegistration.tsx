'use client';

import { useState } from 'react';
import { UserPlus, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LoyaltyRegistrationProps {
  mobileNumber: string;
  franchiseSlug: string;
  onRegistered: (loyaltyInfo: any) => void;
  onCancel: () => void;
}

export default function LoyaltyRegistration({
  mobileNumber,
  franchiseSlug,
  onRegistered,
  onCancel,
}: LoyaltyRegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/${franchiseSlug}/loyalty/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          name: formData.name,
          email: formData.email || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onRegistered(result.data.loyalty_info);
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-orange-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
        <CardTitle className="text-orange-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Join Our Loyalty Program
        </CardTitle>
        <CardDescription className="text-orange-700">
          Earn points and rewards with every purchase!
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mobile Number (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              type="tel"
              value={mobileNumber}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Email (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Benefits Preview */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Member Benefits
            </h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Earn 10 points for every $1 spent</li>
              <li>• Exclusive member-only offers</li>
              <li>• Birthday rewards and surprises</li>
              <li>• Save payment cards for faster checkout</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Join Now'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
