'use client';

import { CreditCard, Award, Star, Calendar, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface LoyaltySessionDisplayProps {
  loyaltyInfo: LoyaltyInfo | null;
  savedCards: SavedCard[];
  mobileNumber: string;
  onSelectCard?: (card: SavedCard) => void;
  selectedCardId?: number;
}

export default function LoyaltySessionDisplay({
  loyaltyInfo,
  savedCards,
  mobileNumber,
  onSelectCard,
  selectedCardId,
}: LoyaltySessionDisplayProps) {
  const getTierColor = (tier: string) => {
    const colors = {
      'Bronze': 'bg-amber-700 text-white',
      'Gold': 'bg-yellow-500 text-gray-900',
      'Platinum': 'bg-slate-400 text-white',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const getCardBrandLogo = (brand: string) => {
    const logos = {
      'Visa': '💳',
      'Mastercard': '💳',
      'American Express': '💳',
      'Discover': '💳',
    };
    return logos[brand as keyof typeof logos] || '💳';
  };

  return (
    <div className="space-y-4">
      {/* Loyalty Info */}
      {loyaltyInfo && (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-orange-900">
                    {loyaltyInfo.is_new_member ? 'Welcome!' : `Welcome back, ${loyaltyInfo.name}!`}
                  </CardTitle>
                  <p className="text-xs text-orange-700">Member #{loyaltyInfo.member_number}</p>
                </div>
              </div>
              <Badge className={getTierColor(loyaltyInfo.tier)}>
                {loyaltyInfo.tier}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-orange-200">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Star className="w-4 h-4" />
                  <span className="text-xs font-medium">Points Balance</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">{loyaltyInfo.points_balance}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-orange-200">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Member Since</span>
                </div>
                <p className="text-sm font-semibold text-orange-900">
                  {new Date(loyaltyInfo.member_since).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-orange-700">
                <Phone className="w-3 h-3" />
                <span>{mobileNumber}</span>
              </div>
              {loyaltyInfo.email && (
                <div className="flex items-center gap-2 text-orange-700">
                  <Mail className="w-3 h-3" />
                  <span>{loyaltyInfo.email}</span>
                </div>
              )}
            </div>

            {loyaltyInfo.is_new_member && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                <p className="text-xs text-green-700">
                  🎉 New member bonus: 50 points added to your account!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Saved Cards */}
      {savedCards.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Saved Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedCards.map((card) => (
              <button
                key={card.id}
                onClick={() => onSelectCard?.(card)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  selectedCardId === card.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCardBrandLogo(card.brand)}</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {card.brand} •••• {card.last4}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires {card.exp_month.toString().padStart(2, '0')}/{card.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {card.is_default && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                    {card.loyalty_linked && (
                      <Badge className="bg-orange-500 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Linked
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No saved cards */}
      {savedCards.length === 0 && (
        <Card className="border-gray-200 border-dashed">
          <CardContent className="py-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No saved payment methods</p>
            <p className="text-xs text-gray-500 mt-1">
              Add a card during checkout to save it for faster ordering
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
