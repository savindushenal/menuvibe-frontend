'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Shield, CreditCard, Gift, ChevronRight, Loader2, Check } from 'lucide-react';

interface LoyaltyInfo {
  member_number: string;
  name: string;
  mobile: string;
  email: string | null;
  points_balance: number;
  tier: string;
  member_since: string;
  lifetime_points: number;
  is_new_member?: boolean;
}

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

interface LoyaltyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (data: {
    loyaltyInfo: LoyaltyInfo | null;
    savedCards: SavedCard[];
    sessionToken: string;
  }) => void;
  franchiseSlug: string;
}

export default function LoyaltyAuthModal({
  isOpen,
  onClose,
  onAuthenticated,
  franchiseSlug,
}: LoyaltyAuthModalProps) {
  const [step, setStep] = useState<'intro' | 'phone' | 'otp' | 'register'>('intro');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('intro');
        setMobileNumber('');
        setOtpCode('');
        setName('');
        setEmail('');
        setError('');
        setDemoOtp('');
      }, 300);
    }
  }, [isOpen]);

  const handleSkip = () => {
    // Skip loyalty - no authentication
    onClose();
  };

  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/${franchiseSlug}/loyalty/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setDemoOtp(data.demo_otp || '');
        setStep('otp');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/${franchiseSlug}/loyalty/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          otp_code: otpCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Check if new member
        if (data.data.loyalty_info?.is_new_member) {
          setStep('register');
        } else {
          // Existing member - authenticate
          onAuthenticated({
            loyaltyInfo: data.data.loyalty_info,
            savedCards: data.data.saved_cards || [],
            sessionToken: data.data.session_token,
          });
          onClose();
        }
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || name.length < 2) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/${franchiseSlug}/loyalty/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          name: name,
          email: email || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Registration successful - authenticate with new member data
        onAuthenticated({
          loyaltyInfo: data.data,
          savedCards: [],
          sessionToken: '',
        });
        onClose();
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-br from-[#F26522] to-orange-600 p-6 rounded-t-3xl">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Loyalty Rewards</h2>
                    <p className="text-white/80 text-sm">Earn points & save cards</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Intro Step */}
                {step === 'intro' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">Welcome! 🎉</h3>
                      <p className="text-gray-600">
                        Sign in to access your loyalty rewards and saved payment methods
                      </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Gift className="w-5 h-5 text-[#F26522]" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Earn Points</h4>
                          <p className="text-sm text-gray-600">
                            Get rewarded on every purchase
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Save Cards</h4>
                          <p className="text-sm text-gray-600">
                            Quick checkout with saved payment methods
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Secure & Fast</h4>
                          <p className="text-sm text-gray-600">
                            One-time password authentication
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => setStep('phone')}
                        className="w-full py-3 px-4 bg-[#F26522] hover:bg-[#E55518] text-white font-semibold rounded-xl transition-colors flex items-center justify-between"
                      >
                        <span>Continue with Mobile Number</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      <button
                        onClick={handleSkip}
                        className="w-full py-3 px-4 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        Skip for now
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Phone Step */}
                {step === 'phone' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                        <Phone className="w-8 h-8 text-[#F26522]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Enter Mobile Number</h3>
                      <p className="text-sm text-gray-600">
                        We'll send you a verification code
                      </p>
                    </div>

                    {/* Phone Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => {
                          setMobileNumber(e.target.value.replace(/\D/g, ''));
                          setError('');
                        }}
                        placeholder="0771234567"
                        maxLength={15}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F26522] focus:outline-none text-lg"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Demo: Try 0771234567, 0777654321, or 0701112233
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <div className="space-y-3">
                      <button
                        onClick={handleSendOtp}
                        disabled={isLoading || mobileNumber.length < 10}
                        className="w-full py-3 px-4 bg-[#F26522] hover:bg-[#E55518] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Sending OTP...
                          </>
                        ) : (
                          <>
                            Send OTP
                            <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setStep('intro')}
                        className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* OTP Step */}
                {step === 'otp' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                        <Shield className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Enter OTP</h3>
                      <p className="text-sm text-gray-600">
                        Code sent to {mobileNumber}
                      </p>
                    </div>

                    {/* Demo OTP Display */}
                    {demoOtp && (
                      <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                        <p className="text-sm font-medium text-yellow-800 mb-1">
                          🎯 Demo Mode
                        </p>
                        <p className="text-xs text-yellow-700">
                          Your OTP is: <span className="font-bold text-lg">{demoOtp}</span>
                        </p>
                      </div>
                    )}

                    {/* OTP Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        6-Digit Code
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ''));
                          setError('');
                        }}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-center text-2xl tracking-widest font-mono"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <div className="space-y-3">
                      <button
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otpCode.length !== 6}
                        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Verify OTP
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        Resend OTP
                      </button>

                      <button
                        onClick={() => setStep('phone')}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        Change Number
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Register Step */}
                {step === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                        <Gift className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Create Account</h3>
                      <p className="text-sm text-gray-600">
                        Complete your profile to join our loyalty program
                      </p>
                    </div>

                    {/* Welcome Bonus */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                      <p className="text-sm font-medium text-purple-800 mb-1">
                        🎁 Welcome Bonus
                      </p>
                      <p className="text-xs text-purple-700">
                        Get <span className="font-bold">50 points</span> when you complete registration!
                      </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setError('');
                          }}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <div className="space-y-3">
                      <button
                        onClick={handleRegister}
                        disabled={isLoading || !name}
                        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Complete Registration
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleSkip}
                        className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        Skip for now
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
