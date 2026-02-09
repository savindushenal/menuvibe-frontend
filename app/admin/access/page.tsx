'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Store, Search, ArrowRight, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface Franchise {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  template_type: string;
  is_active: boolean;
  branches_count?: number;
}

interface Business {
  id: number;
  business_name: string;
  user_id: number;
  owner_name?: string;
  owner_email?: string;
  locations_count?: number;
  subscription_tier?: string;
}

export default function AdminAccessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('franchises');

  useEffect(() => {
    // Check if user is admin/super_admin
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [franchiseRes, businessRes] = await Promise.all([
        api.get('/admin/franchises'),
        api.get('/admin/businesses'),
      ]);

      if (franchiseRes.data.success) {
        setFranchises(franchiseRes.data.data || []);
      }

      if (businessRes.data.success) {
        setBusinesses(businessRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessFranchise = (franchise: Franchise) => {
    router.push(`/${franchise.slug}/dashboard`);
  };

  const handleAccessBusiness = async (business: Business) => {
    // Store temp context for business access
    localStorage.setItem('admin_access_business', JSON.stringify({
      id: business.id,
      user_id: business.user_id,
      name: business.business_name,
    }));
    router.push(`/dashboard?business_id=${business.id}`);
  };

  const filteredFranchises = franchises.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBusinesses = businesses.filter(b =>
    b.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.owner_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Access Control</h1>
              <p className="text-gray-600 mt-1">Login to any franchise or business dashboard</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin')}>
              Back to Admin
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Franchises & Businesses</CardTitle>
                <CardDescription>
                  Select a franchise or business to access their dashboard
                </CardDescription>
              </div>
              <div className="w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="franchises" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Franchises ({filteredFranchises.length})
                </TabsTrigger>
                <TabsTrigger value="businesses" className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Businesses ({filteredBusinesses.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="franchises" className="space-y-3">
                {filteredFranchises.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No franchises found</p>
                  </div>
                ) : (
                  filteredFranchises.map((franchise) => (
                    <div
                      key={franchise.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {franchise.logo_url ? (
                          <img
                            src={franchise.logo_url}
                            alt={franchise.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-emerald-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{franchise.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              /{franchise.slug}
                            </code>
                            <Badge variant={franchise.is_active ? 'default' : 'secondary'}>
                              {franchise.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {franchise.branches_count !== undefined && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {franchise.branches_count} branches
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAccessFranchise(franchise)}
                        disabled={!franchise.is_active}
                        className="flex items-center gap-2"
                      >
                        Access Dashboard
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="businesses" className="space-y-3">
                {filteredBusinesses.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No businesses found</p>
                  </div>
                ) : (
                  filteredBusinesses.map((business) => (
                    <div
                      key={business.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Store className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{business.business_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {business.owner_email && (
                              <span className="text-xs text-gray-500">{business.owner_email}</span>
                            )}
                            {business.subscription_tier && (
                              <Badge variant="outline">{business.subscription_tier}</Badge>
                            )}
                            {business.locations_count !== undefined && (
                              <span className="text-xs text-gray-500">
                                {business.locations_count} locations
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAccessBusiness(business)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        Access Dashboard
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
