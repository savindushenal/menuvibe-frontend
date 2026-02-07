'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Mail,
  Plus,
  RefreshCw,
  Loader2,
  Check,
  X,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  Edit,
  Send,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FranchiseDetails {
  franchise: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    owner: { id: number; name: string; email: string } | null;
    pricing: {
      id: number;
      pricing_type: string;
      yearly_price: number | null;
      per_branch_price: number | null;
      initial_branches: number;
      setup_fee: number;
      billing_cycle: string;
      contract_start_date: string | null;
      contract_end_date: string | null;
    } | null;
  };
  branches: Array<{
    id: number;
    branch_name: string;
    branch_code: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    is_active: boolean;
    is_paid: boolean;
    activated_at: string | null;
  }>;
  accounts: Array<{
    id: number;
    role: string;
    is_active: boolean;
    user: { id: number; name: string; email: string; phone: string | null };
    branch: { id: number; branch_name: string; branch_code: string } | null;
  }>;
  recent_payments: Array<{
    id: number;
    amount: number;
    payment_type: string;
    status: string;
    due_date: string;
    paid_date: string | null;
    payment_method: string | null;
    notes: string | null;
  }>;
  pending_invitations: Array<{
    id: number;
    email: string;
    name: string | null;
    role: string;
    status: string;
    expires_at: string;
    accepted_at: string | null;
    created_at: string;
  }>;
  all_invitations?: Array<{
    id: number;
    email: string;
    name: string | null;
    role: string;
    status: string;
    expires_at: string;
    accepted_at: string | null;
    created_at: string;
  }>;
  stats: {
    total_branches: number;
    active_branches: number;
    paid_branches: number;
    total_accounts: number;
    pending_invitations: number;
    total_paid: number;
    total_pending: number;
  };
}

export default function FranchiseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const franchiseId = parseInt(params.id as string);
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FranchiseDetails | null>(null);
  
  // Modal states
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showPartialPayment, setShowPartialPayment] = useState(false);
  const [selectedPaymentForPartial, setSelectedPaymentForPartial] = useState<{id: number; amount: number; remaining: number} | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Send password states
  const [showSendPassword, setShowSendPassword] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{id: number; userId: number; name: string; email: string} | null>(null);
  const [sendingPassword, setSendingPassword] = useState(false);

  // Form states
  const [branchForm, setBranchForm] = useState({
    branch_name: '',
    address: '',
    city: '',
    phone: '',
  });
  
  const [paymentForm, setPaymentForm] = useState<{
    amount: string;
    payment_type: 'setup' | 'monthly' | 'quarterly' | 'yearly' | 'branch_addition' | 'custom';
    status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
    due_date: string;
    paid_date: string;
    payment_method: string;
    notes: string;
    branches_count: string;
  }>({
    amount: '',
    payment_type: 'monthly',
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0],
    paid_date: '',
    payment_method: '',
    notes: '',
    branches_count: '',
  });
  
  const [accountForm, setAccountForm] = useState<{
    name: string;
    email: string;
    phone: string;
    role: 'franchise_owner' | 'franchise_manager' | 'branch_manager' | 'staff';
    branch_id: string;
    send_credentials: boolean;
  }>({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    branch_id: 'all',
    send_credentials: true,
  });
  
  const [inviteForm, setInviteForm] = useState<{
    email: string;
    name: string;
    role: 'franchise_owner' | 'franchise_manager' | 'branch_manager' | 'staff';
    branch_id: string;
    message: string;
    send_credentials: boolean;
  }>({
    email: '',
    name: '',
    role: 'staff',
    branch_id: 'all',
    message: '',
    send_credentials: true,
  });

  const fetchData = useCallback(async () => {
    try {
      const response = await apiClient.getFranchiseDetails(franchiseId);
      if (response.success) {
        setData(response.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load franchise details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [franchiseId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  const handleAddBranch = async () => {
    if (!branchForm.branch_name) return;
    setSubmitting(true);
    try {
      const response = await apiClient.addFranchiseBranch(franchiseId, branchForm);
      if (response.success) {
        toast({ title: 'Success', description: 'Branch added successfully' });
        setShowAddBranch(false);
        setBranchForm({ branch_name: '', address: '', city: '', phone: '' });
        fetchData();
      } else {
        toast({ title: 'Error', description: response.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add branch', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaymentPaid = async (paymentId: number) => {
    try {
      const response = await apiClient.updateFranchisePayment(franchiseId, paymentId, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
      });
      if (response.success) {
        toast({ title: 'Success', description: 'Payment marked as paid' });
        fetchData();
      } else {
        toast({ title: 'Error', description: response.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update payment', variant: 'destructive' });
    }
  };

  const handleMarkAllPaid = async () => {
    const unpaidPayments = recent_payments.filter(p => p.status !== 'paid' && p.status !== 'cancelled');
    if (unpaidPayments.length === 0) {
      toast({ title: 'Info', description: 'No pending payments to mark as paid' });
      return;
    }
    
    if (!confirm(`Mark ${unpaidPayments.length} payment(s) as paid?`)) return;
    
    setSubmitting(true);
    try {
      let successCount = 0;
      for (const payment of unpaidPayments) {
        const response = await apiClient.updateFranchisePayment(franchiseId, payment.id, {
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
        });
        if (response.success) successCount++;
      }
      toast({ title: 'Success', description: `${successCount} payment(s) marked as paid` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update some payments', variant: 'destructive' });
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPartialPayment = (payment: { id: number; amount: number; status: string }) => {
    setSelectedPaymentForPartial({ id: payment.id, amount: payment.amount, remaining: payment.amount });
    setPartialAmount('');
    setShowPartialPayment(true);
  };

  const handlePartialPayment = async () => {
    if (!selectedPaymentForPartial || !partialAmount) return;
    
    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    
    if (amount > selectedPaymentForPartial.amount) {
      toast({ title: 'Error', description: 'Partial amount cannot exceed total amount', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Record the partial payment as a new payment entry
      const response = await apiClient.recordFranchisePayment(franchiseId, {
        amount: amount,
        payment_type: 'custom',
        status: 'paid',
        due_date: new Date().toISOString().split('T')[0],
        paid_date: new Date().toISOString().split('T')[0],
        notes: `Partial payment for payment #${selectedPaymentForPartial.id}`,
      });
      
      // If full amount paid, mark original as paid
      if (amount >= selectedPaymentForPartial.amount) {
        await apiClient.updateFranchisePayment(franchiseId, selectedPaymentForPartial.id, {
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          notes: 'Paid in full',
        });
      } else {
        // Update original payment with remaining amount note
        const remaining = selectedPaymentForPartial.amount - amount;
        await apiClient.updateFranchisePayment(franchiseId, selectedPaymentForPartial.id, {
          notes: `Partial payment received: ${formatCurrency(amount)}. Remaining: ${formatCurrency(remaining)}`,
        });
      }

      if (response.success) {
        toast({ title: 'Success', description: `Partial payment of ${formatCurrency(amount)} recorded` });
        setShowPartialPayment(false);
        setSelectedPaymentForPartial(null);
        setPartialAmount('');
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to record partial payment', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || !paymentForm.due_date) return;
    setSubmitting(true);
    try {
      const response = await apiClient.recordFranchisePayment(franchiseId, {
        amount: parseFloat(paymentForm.amount),
        payment_type: paymentForm.payment_type,
        status: paymentForm.status,
        due_date: paymentForm.due_date,
        paid_date: paymentForm.paid_date || undefined,
        payment_method: paymentForm.payment_method || undefined,
        notes: paymentForm.notes || undefined,
        branches_count: paymentForm.branches_count ? parseInt(paymentForm.branches_count) : undefined,
      });
      if (response.success) {
        toast({ title: 'Success', description: 'Payment recorded successfully' });
        setShowAddPayment(false);
        setPaymentForm({
          amount: '',
          payment_type: 'monthly',
          status: 'pending',
          due_date: new Date().toISOString().split('T')[0],
          paid_date: '',
          payment_method: '',
          notes: '',
          branches_count: '',
        });
        fetchData();
      } else {
        toast({ title: 'Error', description: response.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to record payment', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountForm.name || !accountForm.email) return;
    setSubmitting(true);
    try {
      const response = await apiClient.createFranchiseAccount(franchiseId, {
        name: accountForm.name,
        email: accountForm.email,
        phone: accountForm.phone || undefined,
        role: accountForm.role,
        branch_id: accountForm.branch_id && accountForm.branch_id !== 'all' ? parseInt(accountForm.branch_id) : undefined,
        send_credentials: accountForm.send_credentials,
      });
      if (response.success) {
        toast({ title: 'Success', description: 'Account created successfully' });
        setShowAddAccount(false);
        setAccountForm({
          name: '',
          email: '',
          phone: '',
          role: 'staff',
          branch_id: 'all',
          send_credentials: true,
        });
        fetchData();
      } else {
        const errorMsg = response.errors 
          ? Object.values(response.errors).flat().join(', ')
          : response.message;
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
      }
    } catch (error: any) {
      const responseErrors = error?.response?.errors;
      const errorMsg = responseErrors 
        ? Object.values(responseErrors).flat().join(', ')
        : error?.message || 'Failed to create account';
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteForm.email) return;
    setSubmitting(true);
    try {
      const response = await apiClient.sendFranchiseInvitation(franchiseId, {
        email: inviteForm.email,
        name: inviteForm.name || undefined,
        role: inviteForm.role,
        branch_id: inviteForm.branch_id && inviteForm.branch_id !== 'all' ? parseInt(inviteForm.branch_id) : undefined,
        message: inviteForm.message || undefined,
        send_credentials: inviteForm.send_credentials,
      });
      if (response.success) {
        toast({ title: 'Success', description: 'Invitation sent successfully' });
        setShowInvite(false);
        setInviteForm({
          email: '',
          name: '',
          role: 'staff',
          branch_id: 'all',
          message: '',
          send_credentials: true,
        });
        fetchData();
      } else {
        toast({ title: 'Error', description: response.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send invitation', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBranch = async (branchId: number) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    try {
      const response = await apiClient.deleteFranchiseBranch(franchiseId, branchId);
      if (response.success) {
        toast({ title: 'Success', description: 'Branch deleted' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete branch', variant: 'destructive' });
    }
  };

  const handleResendInvite = async (invitationId: number) => {
    try {
      const response = await apiClient.resendFranchiseInvitation(franchiseId, invitationId);
      if (response.success) {
        toast({ title: 'Success', description: 'Invitation resent' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to resend invitation', variant: 'destructive' });
    }
  };

  const handleCancelInvite = async (invitationId: number) => {
    try {
      const response = await apiClient.cancelFranchiseInvitation(franchiseId, invitationId);
      if (response.success) {
        toast({ title: 'Success', description: 'Invitation cancelled' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel invitation', variant: 'destructive' });
    }
  };

  const handleSendGeneratedPassword = async () => {
    if (!selectedAccount) return;
    
    setSendingPassword(true);
    try {
      const response = await apiClient.generateAndSendPassword(selectedAccount.userId);
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message || 'New password generated and sent to user\'s email',
        });
        
        // If email failed, show the password in a warning toast
        if (response.data?.password && !response.data?.email_sent) {
          toast({
            title: 'Warning: Email Failed',
            description: `Password: ${response.data.password}`,
            variant: 'destructive',
          });
        }
        
        setShowSendPassword(false);
        setSelectedAccount(null);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate password',
        variant: 'destructive',
      });
    } finally {
      setSendingPassword(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'franchise_owner':
        return <Badge className="bg-purple-100 text-purple-800">Owner</Badge>;
      case 'franchise_manager':
        return <Badge className="bg-blue-100 text-blue-800">Manager</Badge>;
      case 'branch_manager':
        return <Badge className="bg-cyan-100 text-cyan-800">Branch Mgr</Badge>;
      case 'staff':
        return <Badge variant="secondary">Staff</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Franchise not found</p>
      </div>
    );
  }

  const { franchise, branches, accounts, recent_payments, pending_invitations, stats } = data;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/franchises')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{franchise.name}</h1>
              <Badge variant={franchise.is_active ? 'default' : 'secondary'}>
                {franchise.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {franchise.owner ? `Owned by ${franchise.owner.name}` : 'No owner assigned'}
            </p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Branches</p>
                  <p className="text-2xl font-bold">{stats.active_branches}/{stats.total_branches}</p>
                </div>
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Branches</p>
                  <p className="text-2xl font-bold">{stats.paid_branches}</p>
                </div>
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_paid)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_pending)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Info */}
        {franchise.pricing && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Pricing Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Model</p>
                  <p className="font-medium">
                    {franchise.pricing.pricing_type === 'fixed_yearly'
                      ? 'Fixed Yearly'
                      : franchise.pricing.pricing_type === 'pay_as_you_go'
                      ? 'Pay As You Go'
                      : 'Custom'}
                  </p>
                </div>
                {franchise.pricing.yearly_price && (
                  <div>
                    <p className="text-muted-foreground">Yearly Price</p>
                    <p className="font-medium">{formatCurrency(franchise.pricing.yearly_price)}</p>
                  </div>
                )}
                {franchise.pricing.per_branch_price && (
                  <div>
                    <p className="text-muted-foreground">Per Branch/Month</p>
                    <p className="font-medium">{formatCurrency(franchise.pricing.per_branch_price)}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Billing Cycle</p>
                  <p className="font-medium capitalize">{franchise.pricing.billing_cycle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="branches" className="space-y-4">
          <TabsList>
            <TabsTrigger value="branches">
              <MapPin className="h-4 w-4 mr-2" />
              Branches ({stats.total_branches})
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="accounts">
              <Users className="h-4 w-4 mr-2" />
              Accounts ({stats.total_accounts})
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <Mail className="h-4 w-4 mr-2" />
              Invitations ({stats.pending_invitations})
            </TabsTrigger>
          </TabsList>

          {/* Branches Tab */}
          <TabsContent value="branches">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Branches</CardTitle>
                <Button onClick={() => setShowAddBranch(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Branch
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">{branch.branch_name}</TableCell>
                        <TableCell className="font-mono text-sm">{branch.branch_code}</TableCell>
                        <TableCell>
                          {branch.city || branch.address || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                            {branch.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {branch.is_paid ? (
                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Unpaid</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDeleteBranch(branch.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {branches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No branches yet. Add your first branch.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription className="mt-1">
                    {recent_payments.filter(p => p.status === 'pending' || p.status === 'overdue').length} pending payment(s)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {recent_payments.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={handleMarkAllPaid}
                      disabled={submitting}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark All Paid
                    </Button>
                  )}
                  <Button onClick={() => setShowAddPayment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent_payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="capitalize">{payment.payment_type.replace('_', ' ')}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{payment.due_date}</TableCell>
                        <TableCell>{payment.paid_date || '-'}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{payment.notes || '-'}</TableCell>
                        <TableCell>
                          {payment.status !== 'paid' && payment.status !== 'cancelled' && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkPaymentPaid(payment.id)}
                                className="text-green-600 hover:text-green-700 px-2"
                                title="Mark as fully paid"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenPartialPayment(payment)}
                                className="text-blue-600 hover:text-blue-700 px-2"
                                title="Record partial payment"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {payment.status === 'paid' && (
                            <Badge variant="outline" className="text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          )}
                          {payment.status === 'cancelled' && (
                            <Badge variant="outline" className="text-gray-500">
                              Cancelled
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {recent_payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No payments recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Accounts</CardTitle>
                <Button onClick={() => setShowAddAccount(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Account
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.user.name}</TableCell>
                        <TableCell>{account.user.email}</TableCell>
                        <TableCell>{getRoleBadge(account.role)}</TableCell>
                        <TableCell>
                          {account.branch ? account.branch.branch_name : 'All Branches'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.is_active ? 'default' : 'secondary'}>
                            {account.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAccount({
                                    id: account.id,
                                    userId: account.user.id,
                                    name: account.user.name,
                                    email: account.user.email,
                                  });
                                  setShowSendPassword(true);
                                }}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Generated Password
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {accounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No accounts yet. Create or invite users.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Invitations</CardTitle>
                <Button onClick={() => setShowInvite(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send New Invitation
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.all_invitations || pending_invitations).map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>{invite.email}</TableCell>
                        <TableCell>{invite.name || '-'}</TableCell>
                        <TableCell>{getRoleBadge(invite.role)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            invite.status === 'accepted' ? 'default' :
                            invite.status === 'pending' ? 'secondary' :
                            invite.status === 'expired' ? 'outline' : 'destructive'
                          }>
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invite.status === 'accepted' && invite.accepted_at
                            ? new Date(invite.accepted_at).toLocaleDateString()
                            : new Date(invite.expires_at).toLocaleDateString()
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResendInvite(invite.id)}
                              title={invite.status === 'accepted' ? 'Resend Credentials' : 'Resend Invitation'}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            {invite.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancelInvite(invite.id)}
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(data?.all_invitations || pending_invitations).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No invitations yet. Send one to add team members.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Partial Payment Dialog */}
        <Dialog open={showPartialPayment} onOpenChange={setShowPartialPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Partial Payment</DialogTitle>
              <DialogDescription>
                Enter the amount received for this payment.
                {selectedPaymentForPartial && (
                  <span className="block mt-2 font-medium">
                    Total Amount: {formatCurrency(selectedPaymentForPartial.amount)}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Amount Received (LKR) *</Label>
                <Input
                  type="number"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={selectedPaymentForPartial?.amount}
                />
                {selectedPaymentForPartial && partialAmount && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Remaining: {formatCurrency(Math.max(0, selectedPaymentForPartial.amount - parseFloat(partialAmount || '0')))}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPartialPayment(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePartialPayment} 
                disabled={submitting || !partialAmount || parseFloat(partialAmount) <= 0}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Branch Dialog */}
        <Dialog open={showAddBranch} onOpenChange={setShowAddBranch}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Branch</DialogTitle>
              <DialogDescription>Add a new branch to this franchise</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Branch Name *</Label>
                <Input
                  value={branchForm.branch_name}
                  onChange={(e) => setBranchForm({ ...branchForm, branch_name: e.target.value })}
                  placeholder="e.g., Downtown Branch"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="Phone"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddBranch(false)}>Cancel</Button>
              <Button onClick={handleAddBranch} disabled={submitting || !branchForm.branch_name}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Branch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Payment Dialog */}
        <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>Record a payment for this franchise</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount (LKR) *</Label>
                  <Input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={paymentForm.payment_type}
                    onValueChange={(v: any) => setPaymentForm({ ...paymentForm, payment_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="setup">Setup Fee</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="branch_addition">Branch Addition</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={paymentForm.due_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={paymentForm.status}
                    onValueChange={(v: any) => setPaymentForm({ ...paymentForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {paymentForm.status === 'paid' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Paid Date</Label>
                    <Input
                      type="date"
                      value={paymentForm.paid_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paid_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Input
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                      placeholder="e.g., Bank Transfer"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Payment notes..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPayment(false)}>Cancel</Button>
              <Button onClick={handleAddPayment} disabled={submitting || !paymentForm.amount}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Account Dialog */}
        <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Account</DialogTitle>
              <DialogDescription>Create a new user account for this franchise</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    placeholder="Phone"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={accountForm.role}
                    onValueChange={(v: any) => setAccountForm({ ...accountForm, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="franchise_owner">Franchise Owner</SelectItem>
                      <SelectItem value="franchise_manager">Franchise Manager</SelectItem>
                      <SelectItem value="branch_manager">Branch Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {branches.length > 0 && (
                <div>
                  <Label>Branch (optional)</Label>
                  <Select
                    value={accountForm.branch_id}
                    onValueChange={(v) => setAccountForm({ ...accountForm, branch_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.branch_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Send login credentials by email</Label>
                <Switch
                  checked={accountForm.send_credentials}
                  onCheckedChange={(v) => setAccountForm({ ...accountForm, send_credentials: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddAccount(false)}>Cancel</Button>
              <Button onClick={handleAddAccount} disabled={submitting || !accountForm.name || !accountForm.email}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Invitation Dialog */}
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Invitation</DialogTitle>
              <DialogDescription>Invite someone to join this franchise</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="Recipient's name"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(v: any) => setInviteForm({ ...inviteForm, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="franchise_owner">Franchise Owner</SelectItem>
                      <SelectItem value="franchise_manager">Franchise Manager</SelectItem>
                      <SelectItem value="branch_manager">Branch Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Message (optional)</Label>
                <Textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  placeholder="Personal message to include in the invitation..."
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto-generate and send password</Label>
                <Switch
                  checked={inviteForm.send_credentials}
                  onCheckedChange={(v) => setInviteForm({ ...inviteForm, send_credentials: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button onClick={handleSendInvite} disabled={submitting || !inviteForm.email}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Generated Password Dialog */}
        <Dialog open={showSendPassword} onOpenChange={setShowSendPassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Generated Password
              </DialogTitle>
              <DialogDescription>
                This will generate a new random password for {selectedAccount?.name} and send it to their email address ({selectedAccount?.email}).
                Their current password will be invalidated and all active sessions will be revoked.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSendPassword(false)} disabled={sendingPassword}>
                Cancel
              </Button>
              <Button onClick={handleSendGeneratedPassword} disabled={sendingPassword}>
                {sendingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Generate & Send Password'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
