'use client';

import { useState } from 'react';
import { CreditCard, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface AddPaymentCardProps {
  franchiseSlug: string;
  sessionToken: string;
  onCardAdded: (card: any) => void;
  onCancel: () => void;
}

export default function AddPaymentCard({
  franchiseSlug,
  sessionToken,
  onCardAdded,
  onCancel,
}: AddPaymentCardProps) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    setAsDefault: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '');

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setFormData({ ...formData, cardNumber: formatted });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cardDigits = formData.cardNumber.replace(/\s/g, '');
    
    if (cardDigits.length !== 16) {
      setError('Please enter a valid 16-digit card number');
      return;
    }

    if (!formData.cardholderName) {
      setError('Please enter cardholder name');
      return;
    }

    if (!formData.expiryMonth || !formData.expiryYear) {
      setError('Please enter card expiry date');
      return;
    }

    if (formData.cvv.length !== 3) {
      setError('Please enter a valid 3-digit CVV');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/${franchiseSlug}/loyalty/save-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          card_number: cardDigits,
          cardholder_name: formData.cardholderName,
          exp_month: formData.expiryMonth,
          exp_year: formData.expiryYear,
          cvv: formData.cvv,
          set_as_default: formData.setAsDefault,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onCardAdded(result.data.card);
      } else {
        setError(result.message || 'Failed to add card');
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
          <CreditCard className="w-5 h-5" />
          Add Payment Card
        </CardTitle>
        <CardDescription className="text-orange-700 flex items-center gap-2">
          <Lock className="w-3 h-3" />
          Your card details are securely encrypted
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">
              Card Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              required
              maxLength={19}
            />
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardholderName">
              Cardholder Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cardholderName"
              type="text"
              placeholder="JOHN DOE"
              value={formData.cardholderName}
              onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value.toUpperCase() })}
              required
            />
          </div>

          {/* Expiry Date and CVV */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">
                Month <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expiryMonth"
                type="text"
                placeholder="MM"
                value={formData.expiryMonth}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 2 && (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12))) {
                    setFormData({ ...formData, expiryMonth: value });
                  }
                }}
                required
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryYear">
                Year <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expiryYear"
                type="text"
                placeholder="YY"
                value={formData.expiryYear}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 2) {
                    setFormData({ ...formData, expiryYear: value });
                  }
                }}
                required
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">
                CVV <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cvv"
                type="text"
                placeholder="123"
                value={formData.cvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 3) {
                    setFormData({ ...formData, cvv: value });
                  }
                }}
                required
                maxLength={3}
              />
            </div>
          </div>

          {/* Set as Default */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="setAsDefault"
              checked={formData.setAsDefault}
              onCheckedChange={(checked) => setFormData({ ...formData, setAsDefault: checked as boolean })}
            />
            <Label
              htmlFor="setAsDefault"
              className="text-sm font-normal cursor-pointer"
            >
              Set as default payment method
            </Label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Demo Notice */}
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-800">
              <strong>Demo Mode:</strong> This is a test environment. Use demo card: 4242 4242 4242 4242, any future date, any CVV.
            </p>
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
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Card'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
