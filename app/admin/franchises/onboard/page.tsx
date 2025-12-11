'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Calendar,
  Mail,
  User,
  Phone,
  FileText,
  Loader2,
  Check,
  Info,
} from 'lucide-react';

type PricingType = 'fixed_yearly' | 'pay_as_you_go' | 'custom';
type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

interface FormData {
  // Basic Info
  name: string;
  description: string;
  
  // Owner Info
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  
  // Pricing
  pricing_type: PricingType;
  yearly_price: string;
  per_branch_price: string;
  initial_branches: string;
  setup_fee: string;
  billing_cycle: BillingCycle;
  
  // Contract
  contract_start_date: string;
  contract_end_date: string;
  custom_terms: string;
  
  // Options
  create_owner_account: boolean;
  send_credentials: boolean;
}

export default function FranchiseOnboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<{
    franchise: any;
    owner_created: boolean;
    temp_password: string | null;
  } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    pricing_type: 'pay_as_you_go',
    yearly_price: '',
    per_branch_price: '8000',
    initial_branches: '10',
    setup_fee: '0',
    billing_cycle: 'monthly',
    contract_start_date: new Date().toISOString().split('T')[0],
    contract_end_date: '',
    custom_terms: '',
    create_owner_account: true,
    send_credentials: true,
  });

  const updateFormData = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const calculateTotals = () => {
    const branches = parseInt(formData.initial_branches) || 0;
    const perBranch = parseFloat(formData.per_branch_price) || 0;
    const yearly = parseFloat(formData.yearly_price) || 0;
    const setup = parseFloat(formData.setup_fee) || 0;

    if (formData.pricing_type === 'fixed_yearly') {
      return {
        monthly: yearly / 12,
        yearly: yearly,
        total_first_year: yearly + setup,
      };
    } else if (formData.pricing_type === 'pay_as_you_go') {
      const monthlyTotal = branches * perBranch;
      return {
        monthly: monthlyTotal,
        yearly: monthlyTotal * 12,
        total_first_year: monthlyTotal * 12 + setup,
      };
    }
    return { monthly: 0, yearly: 0, total_first_year: setup };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.owner_email || !formData.owner_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.onboardFranchise({
        name: formData.name,
        description: formData.description || undefined,
        owner_email: formData.owner_email,
        owner_name: formData.owner_name,
        owner_phone: formData.owner_phone || undefined,
        pricing_type: formData.pricing_type,
        yearly_price: formData.yearly_price ? parseFloat(formData.yearly_price) : undefined,
        per_branch_price: formData.per_branch_price ? parseFloat(formData.per_branch_price) : undefined,
        initial_branches: formData.initial_branches ? parseInt(formData.initial_branches) : undefined,
        setup_fee: formData.setup_fee ? parseFloat(formData.setup_fee) : undefined,
        billing_cycle: formData.billing_cycle,
        contract_start_date: formData.contract_start_date || undefined,
        contract_end_date: formData.contract_end_date || undefined,
        custom_terms: formData.custom_terms || undefined,
        create_owner_account: formData.create_owner_account,
        send_credentials: formData.send_credentials,
      });

      if (response.success) {
        setResult(response.data);
        setStep(4);
        toast({
          title: 'Franchise Created',
          description: `${formData.name} has been successfully onboarded`,
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create franchise',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while creating the franchise',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/franchises')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Onboard New Franchise</h1>
            <p className="text-muted-foreground">Create a new franchise with custom pricing</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-20 h-1 mx-2 ${
                    step > s ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mb-8 text-sm text-muted-foreground">
          <span className={step >= 1 ? 'text-foreground font-medium' : ''}>Basic Info</span>
          <span className={step >= 2 ? 'text-foreground font-medium' : ''}>Pricing</span>
          <span className={step >= 3 ? 'text-foreground font-medium' : ''}>Review</span>
          <span className={step >= 4 ? 'text-foreground font-medium' : ''}>Complete</span>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Franchise Details
              </CardTitle>
              <CardDescription>Enter the franchise and owner information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Franchise Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Franchise Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Franchise Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      placeholder="e.g., Pizza Palace International"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder="Brief description of the franchise..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Owner Info */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="owner_name">Owner Name *</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => updateFormData('owner_name', e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner_phone">Phone Number</Label>
                    <Input
                      id="owner_phone"
                      value={formData.owner_phone}
                      onChange={(e) => updateFormData('owner_phone', e.target.value)}
                      placeholder="+94 77 123 4567"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="owner_email">Owner Email *</Label>
                    <Input
                      id="owner_email"
                      type="email"
                      value={formData.owner_email}
                      onChange={(e) => updateFormData('owner_email', e.target.value)}
                      placeholder="owner@franchise.com"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Options */}
              <div className="space-y-4">
                <h3 className="font-semibold">Account Settings</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Create Owner Account</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create a user account for the owner
                    </p>
                  </div>
                  <Switch
                    checked={formData.create_owner_account}
                    onCheckedChange={(v) => updateFormData('create_owner_account', v)}
                  />
                </div>
                {formData.create_owner_account && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Send Login Credentials</Label>
                      <p className="text-sm text-muted-foreground">
                        Email the owner their login details automatically
                      </p>
                    </div>
                    <Switch
                      checked={formData.send_credentials}
                      onCheckedChange={(v) => updateFormData('send_credentials', v)}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)} disabled={!formData.name || !formData.owner_email || !formData.owner_name}>
                  Continue to Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Pricing */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Configuration
              </CardTitle>
              <CardDescription>Set up the franchise pricing model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing Type Selection */}
              <div className="space-y-4">
                <Label>Pricing Model *</Label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card
                    className={`cursor-pointer transition-all ${
                      formData.pricing_type === 'fixed_yearly'
                        ? 'border-primary ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => updateFormData('pricing_type', 'fixed_yearly')}
                  >
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold">Fixed Yearly</h4>
                      <p className="text-sm text-muted-foreground">Lump sum annual payment</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all ${
                      formData.pricing_type === 'pay_as_you_go'
                        ? 'border-primary ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => updateFormData('pricing_type', 'pay_as_you_go')}
                  >
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold">Pay As You Go</h4>
                      <p className="text-sm text-muted-foreground">Per branch per month</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all ${
                      formData.pricing_type === 'custom'
                        ? 'border-primary ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => updateFormData('pricing_type', 'custom')}
                  >
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold">Custom</h4>
                      <p className="text-sm text-muted-foreground">Custom payment terms</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Pricing Details */}
              {formData.pricing_type === 'fixed_yearly' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Fixed Yearly Pricing</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="yearly_price">Annual Price (LKR) *</Label>
                      <Input
                        id="yearly_price"
                        type="number"
                        value={formData.yearly_price}
                        onChange={(e) => updateFormData('yearly_price', e.target.value)}
                        placeholder="e.g., 7200000"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Example: 7,200,000.00 LKR/year
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="setup_fee">Setup Fee (LKR)</Label>
                      <Input
                        id="setup_fee"
                        type="number"
                        value={formData.setup_fee}
                        onChange={(e) => updateFormData('setup_fee', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.pricing_type === 'pay_as_you_go' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Pay As You Go Pricing</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="per_branch_price">Price Per Branch (LKR/month) *</Label>
                      <Input
                        id="per_branch_price"
                        type="number"
                        value={formData.per_branch_price}
                        onChange={(e) => updateFormData('per_branch_price', e.target.value)}
                        placeholder="8000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="initial_branches">Starting Branches *</Label>
                      <Input
                        id="initial_branches"
                        type="number"
                        value={formData.initial_branches}
                        onChange={(e) => updateFormData('initial_branches', e.target.value)}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="setup_fee">Setup Fee (LKR)</Label>
                      <Input
                        id="setup_fee"
                        type="number"
                        value={formData.setup_fee}
                        onChange={(e) => updateFormData('setup_fee', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_cycle">Billing Cycle</Label>
                      <Select
                        value={formData.billing_cycle}
                        onValueChange={(v: BillingCycle) => updateFormData('billing_cycle', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Calculation Preview */}
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Pricing Calculation</h4>
                      <div className="text-sm space-y-1">
                        <p>{formData.initial_branches} branches × {formatCurrency(parseFloat(formData.per_branch_price) || 0)}/branch/month</p>
                        <p className="font-semibold">= {formatCurrency(totals.monthly)}/month</p>
                        <p className="text-muted-foreground">= {formatCurrency(totals.yearly)}/year</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {formData.pricing_type === 'custom' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Custom Pricing Terms</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="custom_terms">Payment Terms *</Label>
                      <Textarea
                        id="custom_terms"
                        value={formData.custom_terms}
                        onChange={(e) => updateFormData('custom_terms', e.target.value)}
                        placeholder="Describe the custom payment arrangement..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="setup_fee">Setup Fee (LKR)</Label>
                      <Input
                        id="setup_fee"
                        type="number"
                        value={formData.setup_fee}
                        onChange={(e) => updateFormData('setup_fee', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Contract Dates */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Contract Period
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="contract_start_date">Start Date</Label>
                    <Input
                      id="contract_start_date"
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => updateFormData('contract_start_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contract_end_date">End Date</Label>
                    <Input
                      id="contract_end_date"
                      type="date"
                      value={formData.contract_end_date}
                      onChange={(e) => updateFormData('contract_end_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Review & Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Review & Confirm
              </CardTitle>
              <CardDescription>Review the franchise details before creating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Franchise Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold">Franchise Details</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  {formData.description && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description:</span>
                      <span className="font-medium max-w-[60%] text-right">{formData.description}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Owner Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold">Owner Details</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{formData.owner_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{formData.owner_email}</span>
                  </div>
                  {formData.owner_phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{formData.owner_phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account:</span>
                    <span className="font-medium">
                      {formData.create_owner_account ? 'Will be created' : 'Not creating'}
                      {formData.create_owner_account && formData.send_credentials && ' (with email)'}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold">Pricing Summary</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <Badge variant="secondary">
                      {formData.pricing_type === 'fixed_yearly'
                        ? 'Fixed Yearly'
                        : formData.pricing_type === 'pay_as_you_go'
                        ? 'Pay As You Go'
                        : 'Custom'}
                    </Badge>
                  </div>
                  {formData.pricing_type === 'fixed_yearly' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Price:</span>
                      <span className="font-medium">{formatCurrency(parseFloat(formData.yearly_price) || 0)}</span>
                    </div>
                  )}
                  {formData.pricing_type === 'pay_as_you_go' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Branch/Month:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(formData.per_branch_price) || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starting Branches:</span>
                        <span className="font-medium">{formData.initial_branches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Total:</span>
                        <span className="font-medium">{formatCurrency(totals.monthly)}</span>
                      </div>
                    </>
                  )}
                  {parseFloat(formData.setup_fee) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Setup Fee:</span>
                      <span className="font-medium">{formatCurrency(parseFloat(formData.setup_fee))}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-muted-foreground font-medium">First Year Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(totals.total_first_year)}</span>
                  </div>
                </div>
              </div>

              {formData.contract_start_date && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold">Contract Period</h3>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span className="font-medium">{formData.contract_start_date}</span>
                      </div>
                      {formData.contract_end_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span className="font-medium">{formData.contract_end_date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Franchise
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 4 && result && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Franchise Created Successfully!</CardTitle>
              <CardDescription>
                {formData.name} has been onboarded to the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Franchise ID:</span>
                    <span className="font-mono">{result.franchise.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  {result.owner_created && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="font-medium text-sm">Owner Account Created</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-mono">{formData.owner_email}</span>
                        </div>
                        {result.temp_password && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Temp Password:</span>
                            <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded">
                              {result.temp_password}
                            </span>
                          </div>
                        )}
                        {formData.send_credentials && (
                          <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                            <Mail className="h-4 w-4" />
                            <span>Credentials sent to owner&apos;s email</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {result.temp_password && !formData.send_credentials && (
                <Card className="border-yellow-300 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <Info className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-800">Save the password!</p>
                        <p className="text-sm text-yellow-700">
                          Since you chose not to send credentials by email, make sure to save
                          or share the temporary password with the franchise owner.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4 justify-center pt-4">
                <Button variant="outline" onClick={() => router.push('/admin/franchises')}>
                  Back to Franchises
                </Button>
                <Button onClick={() => router.push(`/admin/franchises/${result.franchise.id}`)}>
                  View Franchise Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
