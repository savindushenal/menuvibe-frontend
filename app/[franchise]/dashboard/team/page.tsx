'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Mail, Shield, Trash2, Pencil, Loader2, UserPlus, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  branch: string | null;
  branch_id: number | null;
  permissions: Record<string, string[]>;
}

interface Branch {
  id: number;
  name: string;
  address: string;
}

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  franchise_owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  franchise_admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-emerald-100 text-emerald-700',
  branch_manager: 'bg-emerald-100 text-emerald-700',
  staff: 'bg-neutral-100 text-neutral-600',
};

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  franchise_owner: 'Owner',
  admin: 'Admin',
  franchise_admin: 'Admin',
  manager: 'Manager',
  branch_manager: 'Manager',
  staff: 'Staff',
};

export default function FranchiseTeamPage() {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  
  // Action states
  const [inviting, setInviting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  
  // Invite form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviteBranchId, setInviteBranchId] = useState('');
  
  // Edit form
  const [editRole, setEditRole] = useState('staff');
  const [editBranchId, setEditBranchId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, branchesRes] = await Promise.all([
        api.get(`/franchise/${franchiseSlug}/staff`),
        api.get(`/franchise/${franchiseSlug}/branches`)
      ]);
      
      if (staffRes.data.success) {
        setStaff(staffRes.data.data || staffRes.data.staff || []);
      }
      // Handle both response formats: { data: [...] } or { branches: [...] }
      setBranches(branchesRes.data.data || branchesRes.data.branches || []);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (franchiseSlug) {
      fetchData();
    }
  }, [franchiseSlug]);

  const handleInvite = async () => {
    if (!inviteName || !inviteEmail) {
      toast({
        title: 'Error',
        description: 'Please enter name and email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setInviting(true);
      await api.post(`/franchise/${franchiseSlug}/staff`, {
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        branch_id: inviteBranchId ? parseInt(inviteBranchId) : null,
      });

      toast({
        title: 'Success',
        description: 'Team member invited successfully',
      });

      setInviteDialogOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('staff');
      setInviteBranchId('');
      fetchData();
    } catch (err: any) {
      console.error('Error inviting team member:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to invite team member',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedMember) return;

    try {
      setUpdating(true);
      await api.put(`/franchise/${franchiseSlug}/staff/${selectedMember.id}`, {
        role: editRole,
        branch_id: editBranchId ? parseInt(editBranchId) : null,
      });

      toast({
        title: 'Success',
        description: 'Team member updated successfully',
      });

      setEditDialogOpen(false);
      setSelectedMember(null);
      fetchData();
    } catch (err: any) {
      console.error('Error updating team member:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update team member',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (memberId: number) => {
    try {
      setDeleting(memberId);
      await api.delete(`/franchise/${franchiseSlug}/staff/${memberId}`);

      toast({
        title: 'Success',
        description: 'Team member removed successfully',
      });

      fetchData();
    } catch (err: any) {
      console.error('Error removing team member:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to remove team member',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (member: StaffMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditBranchId(member.branch_id?.toString() || '');
    setEditDialogOpen(true);
  };

  const isOwner = (role: string) => {
    return role === 'owner' || role === 'franchise_owner';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Team</h1>
          <p className="text-neutral-600">Manage your franchise team members</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to add a new team member to your franchise.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="team@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admins have full access, Managers can manage branches, Staff have limited access
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch (Optional)</Label>
                <Select value={inviteBranchId || "all"} onValueChange={(val) => setInviteBranchId(val === "all" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Assign to a specific branch or leave empty for all branches
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={inviting}>
                {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No team members yet</h3>
            <p className="text-neutral-600 mb-4">Invite team members to help manage your franchise</p>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite First Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="divide-y">
              {staff.map((member) => (
                <div key={member.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
                        <span className="text-lg font-medium text-neutral-600">
                          {member.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h3 className="font-medium text-neutral-900">{member.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3 text-neutral-400" />
                          <span className="text-sm text-neutral-600">{member.email}</span>
                        </div>
                        {member.branch && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3 text-neutral-400" />
                            <span className="text-xs text-neutral-500">{member.branch}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Badge className={roleColors[member.role] || 'bg-neutral-100 text-neutral-600'}>
                        {roleLabels[member.role] || member.role}
                      </Badge>
                      {!isOwner(member.role) && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-neutral-400 hover:text-neutral-600"
                            onClick={() => openEditDialog(member)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-600">
                                {deleting === member.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.name} from your team?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(member.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update the role and branch assignment for {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-branch">Branch</Label>
              <Select value={editBranchId || "all"} onValueChange={(val) => setEditBranchId(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
