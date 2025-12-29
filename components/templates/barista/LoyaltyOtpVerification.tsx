'use client';

import { useState } from 'react';
import { Phone, CheckCircle, Loader2, CreditCard, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SavedCard {
  id: number;
  gateway_token: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  loyalty_linked: boolean;
}

interface LoyaltyInfo {
  member_number: string;
  name: string;
  mobile: string;
  email?: string;
  points_balance: number;
  tier: string;
  member_since: string;
  lifetime_points?: number;
  is_new_member?: boolean;
}

interface LoyaltyOtpVerificationProps {
  onVerified: (data: {
    mobileNumber: string;
    loyaltyInfo: LoyaltyInfo | null;
    savedCards: SavedCard[];
    sessionToken: string;
  }) => void;
  franchiseSlug: string;
}

export default function LoyaltyOtpVerification({ onVerified, franchiseSlug }: LoyaltyOtpVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '');

  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      setError('Please enter a valid mobile number (10 digits)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/${franchiseSlug}/loyalty/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('otp');
        // DEMO: Show OTP in UI (never do this in production!)
        if (data.demo_otp) {
          setDemoOtp(data.demo_otp);
        }
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/${franchiseSlug}/loyalty/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          otp_code: otpCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onVerified({
          mobileNumber,
          loyaltyInfo: result.data.loyalty_info,
          savedCards: result.data.saved_cards || [],
          sessionToken: result.data.session_token,
        });
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      'Bronze': 'bg-amber-700 text-white',
      'Gold': 'bg-yellow-500 text-gray-900',
      'Platinum': 'bg-slate-400 text-white',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  return (
    <Card className="border-orange-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
        <CardTitle className="text-orange-900 flex items-center gap-2">
          {step === 'phone' ? (
            <>
              <Phone className="w-5 h-5" />
              Verify Your Mobile Number
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Enter Verification Code
            </>
          )}
        </CardTitle>
        <CardDescription className="text-orange-700">
          {step === 'phone'
            ? 'Access your loyalty points and saved payment methods'
            : `We sent a 6-digit code to ${mobileNumber}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {step === 'phone' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-orange-900">Mobile Number</Label>
              <div className="flex gap-2">
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 border-orange-200 focus:border-orange-400"
                  maxLength={10}
                />
                <Button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                </Button>
              </div>
              <p className="text-xs text-orange-600">
                💡 Demo numbers: 0771234567, 0777654321, 0701112233
              </p>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            {demoOtp && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-900">🎯 DEMO MODE</p>
                <p className="text-xs text-yellow-700 mt-1">
                  OTP Code: <span className="font-mono font-bold text-lg">{demoOtp}</span>
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  (In production, this would be sent via SMS)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-orange-900">Enter 6-Digit Code</Label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="border-orange-300" />
                    <InputOTPSlot index={1} className="border-orange-300" />
                    <InputOTPSlot index={2} className="border-orange-300" />
                    <InputOTPSlot index={3} className="border-orange-300" />
                    <InputOTPSlot index={4} className="border-orange-300" />
                    <InputOTPSlot index={5} className="border-orange-300" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.length !== 6}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify & Continue
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setStep('phone');
                setOtpCode('');
                setDemoOtp('');
              }}
              className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              Change Mobile Number
            </Button>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="border-t border-orange-100 pt-4 mt-4">
          <p className="text-xs text-center text-gray-500">
            🔒 Your information is secure and used only for verification
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
