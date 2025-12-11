'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Mail, Shield, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface StaffMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  branch: string | null;
  permissions: Record<string, string[]>;
}

const roleColors: Record<string, string> = {
  franchise_owner: 'bg-purple-100 text-purple-700',
  franchise_admin: 'bg-blue-100 text-blue-700',
  branch_manager: 'bg-emerald-100 text-emerald-700',
  staff: 'bg-neutral-100 text-neutral-600',
};

const roleLabels: Record<string, string> = {
  franchise_owner: 'Owner',
  franchise_admin: 'Admin',
  branch_manager: 'Branch Manager',
  staff: 'Staff',
};

export default function FranchiseTeamPage() {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/franchise/${franchiseSlug}/staff`);
        
        if (response.data.success) {
          setStaff(response.data.data || []);
        }
      } catch (err: any) {
        console.error('Failed to fetch staff:', err);
        setError(err.response?.data?.message || 'Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    if (franchiseSlug) {
      fetchStaff();
    }
  }, [franchiseSlug]);

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
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Team Members */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No team members yet</h3>
            <p className="text-neutral-600 mb-4">Invite team members to help manage your franchise</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
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
                          <span className="text-xs text-neutral-500 mt-1 block">
                            {member.branch}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Badge className={roleColors[member.role] || 'bg-neutral-100 text-neutral-600'}>
                        {roleLabels[member.role] || member.role}
                      </Badge>
                      <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
