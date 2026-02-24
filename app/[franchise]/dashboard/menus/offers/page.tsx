'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Tag, 
  Edit, 
  Trash2, 
  Copy,
  MoreVertical,
  Sparkles,
  Zap,
  Calendar,
  Clock,
  Percent,
  DollarSign,
  Check,
  X,
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { OfferDialog } from '@/components/franchise/master-menu/offer-dialog';

interface Offer {
  id: number;
  master_menu_id: number;
  master_menu_name: string;
  title: string;
  description: string | null;
  offer_type: 'special' | 'instant' | 'seasonal' | 'combo' | 'happy_hour';
  discount_type: 'percentage' | 'fixed_amount' | 'bogo' | 'bundle_price';
  discount_value: number | null;
  image_url: string | null;
  badge_text: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  is_featured: boolean;
  apply_to_all: boolean;
  branch_overrides?: { location_id: number; is_active: boolean }[];
}

interface Branch {
  id: number;
  name: string;
  branch_name?: string;
}

interface MasterMenu {
  id: number;
  name: string;
}

export default function OffersPage() {
  const params = useParams();
  const router = useRouter();
  const franchiseSlug = params?.franchise as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [menus, setMenus] = useState<MasterMenu[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [franchiseId, setFranchiseId] = useState<number | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; offer: Offer | null }>({ open: false, offer: null });
  const [offerDialog, setOfferDialog] = useState<{ open: boolean; offer: Offer | null; menuId: number | null }>({ open: false, offer: null, menuId: null });

  useEffect(() => {
    fetchData();
  }, [franchiseSlug]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const franchiseRes = await api.get(`/franchise/${franchiseSlug}/dashboard`);
      if (franchiseRes.data.success && franchiseRes.data.data.franchise) {
        const fId = franchiseRes.data.data.franchise.id;
        setFranchiseId(fId);

        // Fetch branches for this franchise
        try {
          const branchRes = await api.get(`/franchise/${franchiseSlug}/branches`);
          if (branchRes.data.success) {
            setBranches(branchRes.data.data || []);
          }
        } catch (e) {
          console.error('Failed to fetch branches');
        }
        
        // Fetch all master menus
        const menusRes = await api.get(`/franchises/${fId}/master-menus`);
        if (menusRes.data.success) {
          setMenus(menusRes.data.data || []);
          // Pre-select first menu as default for offer creation
          if ((menusRes.data.data || []).length > 0) {
            setOfferDialog(prev => ({ ...prev, menuId: menusRes.data.data[0].id }));
          }
          
          // Fetch offers from each menu using the dedicated offers endpoint
          const allOffers: Offer[] = [];
          for (const menu of menusRes.data.data || []) {
            try {
              const offersRes = await api.get(`/franchises/${fId}/master-menus/${menu.id}/offers`);
              if (offersRes.data.success) {
                const offersWithMenu = (offersRes.data.data || []).map((o: any) => ({
                  ...o,
                  master_menu_id: menu.id,
                  master_menu_name: menu.name
                }));
                allOffers.push(...offersWithMenu);
              }
            } catch (e) {
              console.error(`Failed to fetch offers for menu ${menu.id}`);
            }
          }
          setOffers(allOffers);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch offers:', err);
      setError(err.response?.data?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.offer || !franchiseId) return;
    
    try {
      const response = await api.delete(
        `/franchises/${franchiseId}/master-menus/${deleteDialog.offer.master_menu_id}/offers/${deleteDialog.offer.id}`
      );
      
      if (response.data.success) {
        toast.success('Offer deleted successfully');
        setOffers(offers.filter(o => o.id !== deleteDialog.offer?.id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete offer');
    } finally {
      setDeleteDialog({ open: false, offer: null });
    }
  };

  const handleToggle = async (offer: Offer) => {
    if (!franchiseId) return;
    
    try {
      const response = await api.post(
        `/franchises/${franchiseId}/master-menus/${offer.master_menu_id}/offers/${offer.id}/toggle`
      );
      
      if (response.data.success) {
        setOffers(offers.map(o => 
          o.id === offer.id ? { ...o, is_active: !o.is_active } : o
        ));
        toast.success(offer.is_active ? 'Offer deactivated' : 'Offer activated');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle offer');
    }
  };

  const handleDuplicate = async (offer: Offer) => {
    if (!franchiseId) return;
    
    try {
      const response = await api.post(
        `/franchises/${franchiseId}/master-menus/${offer.master_menu_id}/offers/${offer.id}/duplicate`
      );
      
      if (response.data.success) {
        toast.success('Offer duplicated successfully');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to duplicate offer');
    }
  };

  const getOfferTypeIcon = (type: Offer['offer_type']) => {
    switch (type) {
      case 'special': return <Sparkles className="h-4 w-4" />;
      case 'instant': return <Zap className="h-4 w-4" />;
      case 'seasonal': return <Calendar className="h-4 w-4" />;
      case 'combo': return <Tag className="h-4 w-4" />;
      case 'happy_hour': return <Clock className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getOfferTypeBadge = (type: Offer['offer_type']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      special: 'default',
      instant: 'destructive',
      seasonal: 'secondary',
      combo: 'outline',
      happy_hour: 'secondary',
    };
    return variants[type] || 'default';
  };

  const isOfferActive = (offer: Offer) => {
    if (!offer.is_active) return false;
    
    const now = new Date();
    if (offer.starts_at && new Date(offer.starts_at) > now) return false;
    if (offer.ends_at && new Date(offer.ends_at) < now) return false;
    
    return true;
  };

  const filteredOffers = offers.filter(offer => {
    if (selectedMenu !== 'all' && offer.master_menu_id.toString() !== selectedMenu) {
      return false;
    }
    if (selectedType !== 'all' && offer.offer_type !== selectedType) {
      return false;
    }
    return true;
  });

  const activeOffers = filteredOffers.filter(o => isOfferActive(o));
  const inactiveOffers = filteredOffers.filter(o => !isOfferActive(o));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Offers & Promotions</h1>
          <p className="text-neutral-600">
            Manage special offers, instant deals, and seasonal promotions
          </p>
        </div>
        {menus.length > 0 && (
          <div className="flex items-center gap-2">
            {menus.length > 1 && (
              <Select
                value={offerDialog.menuId?.toString() ?? menus[0]?.id?.toString()}
                onValueChange={(v) => setOfferDialog(prev => ({ ...prev, menuId: Number(v) }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select menu" />
                </SelectTrigger>
                <SelectContent>
                  {menus.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => setOfferDialog({ open: true, offer: null, menuId: offerDialog.menuId ?? menus[0]?.id ?? null })}>
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Active Offers</p>
                <p className="text-2xl font-bold">{activeOffers.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Special Offers</p>
                <p className="text-2xl font-bold">{offers.filter(o => o.offer_type === 'special').length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Instant Deals</p>
                <p className="text-2xl font-bold">{offers.filter(o => o.offer_type === 'instant').length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Zap className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Seasonal</p>
                <p className="text-2xl font-bold">{offers.filter(o => o.offer_type === 'seasonal').length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <span className="text-sm text-neutral-500">Filter by:</span>
        </div>
        <Select value={selectedMenu} onValueChange={setSelectedMenu}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Menus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Menus</SelectItem>
            {menus.map(menu => (
              <SelectItem key={menu.id} value={menu.id.toString()}>
                {menu.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="special">Special Offers</SelectItem>
            <SelectItem value="instant">Instant Deals</SelectItem>
            <SelectItem value="seasonal">Seasonal</SelectItem>
            <SelectItem value="combo">Combo Deals</SelectItem>
            <SelectItem value="happy_hour">Happy Hour</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Offers List */}
      {menus.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900">No Master Menus Yet</h3>
            <p className="text-neutral-600 mt-1 max-w-sm mx-auto">
              Create a master menu first, then you can add offers to it.
            </p>
            <Button 
              className="mt-6" 
              onClick={() => router.push(`/${franchiseSlug}/dashboard/menus/master`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Master Menu
            </Button>
          </CardContent>
        </Card>
      ) : filteredOffers.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900">No Offers Found</h3>
            <p className="text-neutral-600 mt-1 max-w-sm mx-auto">
              {offers.length === 0 
                ? 'Create your first promotional offer to attract more customers.'
                : 'No offers match your current filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({activeOffers.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveOffers.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeOffers.map((offer) => (
                <OfferCard 
                  key={offer.id}
                  offer={offer}
                  onToggle={handleToggle}
                  onDuplicate={handleDuplicate}
                  onDelete={() => setDeleteDialog({ open: true, offer })}
                  onEdit={() => setOfferDialog({ open: true, offer, menuId: offer.master_menu_id })}
                  getOfferTypeIcon={getOfferTypeIcon}
                  getOfferTypeBadge={getOfferTypeBadge}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="inactive" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactiveOffers.map((offer) => (
                <OfferCard 
                  key={offer.id}
                  offer={offer}
                  onToggle={handleToggle}
                  onDuplicate={handleDuplicate}
                  onDelete={() => setDeleteDialog({ open: true, offer })}
                  onEdit={() => setOfferDialog({ open: true, offer, menuId: offer.master_menu_id })}
                  getOfferTypeIcon={getOfferTypeIcon}
                  getOfferTypeBadge={getOfferTypeBadge}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Create / Edit Offer Dialog */}
      {offerDialog.menuId && (
        <OfferDialog
          open={offerDialog.open}
          onOpenChange={(open) => setOfferDialog({ ...offerDialog, open })}
          offer={offerDialog.offer as any}
          franchiseId={franchiseId}
          menuId={offerDialog.menuId}
          currency="LKR"
          branches={branches}
          onSuccess={() => {
            setOfferDialog({ open: false, offer: null, menuId: null });
            fetchData();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.offer?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OfferCard({ 
  offer, 
  onToggle, 
  onDuplicate, 
  onDelete, 
  onEdit,
  getOfferTypeIcon,
  getOfferTypeBadge 
}: { 
  offer: Offer;
  onToggle: (offer: Offer) => void;
  onDuplicate: (offer: Offer) => void;
  onDelete: () => void;
  onEdit: () => void;
  getOfferTypeIcon: (type: Offer['offer_type']) => JSX.Element;
  getOfferTypeBadge: (type: Offer['offer_type']) => 'default' | 'secondary' | 'destructive' | 'outline';
}) {
  return (
    <Card className={`relative ${!offer.is_active ? 'opacity-60' : ''}`}>
      {offer.image_url && (
        <div className="h-32 bg-neutral-100 overflow-hidden rounded-t-lg">
          <img 
            src={offer.image_url} 
            alt={offer.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getOfferTypeIcon(offer.offer_type)}
              <Badge variant={getOfferTypeBadge(offer.offer_type)} className="text-xs capitalize">
                {offer.offer_type.replace('_', ' ')}
              </Badge>
            </div>
            <CardTitle className="text-base">{offer.title}</CardTitle>
            <CardDescription className="line-clamp-2 text-xs mt-1">
              From: {offer.master_menu_name}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Offer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(offer)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggle(offer)}>
                {offer.is_active ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Discount Info */}
          <div className="flex items-center gap-2 text-sm">
            {offer.discount_type === 'percentage' && (
              <>
                <Percent className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">{offer.discount_value}% OFF</span>
              </>
            )}
            {offer.discount_type === 'fixed_amount' && (
              <>
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">{offer.discount_value} OFF</span>
              </>
            )}
            {offer.discount_type === 'bogo' && (
              <span className="font-semibold text-green-600">Buy One Get One</span>
            )}
            {offer.discount_type === 'bundle_price' && (
              <span className="font-semibold text-green-600">Bundle Deal</span>
            )}
          </div>

          {/* Date Range */}
          {(offer.starts_at || offer.ends_at) && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Clock className="h-3 w-3" />
              <span>
                {offer.starts_at ? new Date(offer.starts_at).toLocaleDateString() : 'Now'}
                {' - '}
                {offer.ends_at ? new Date(offer.ends_at).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between pt-2">
            <Badge variant={offer.is_active ? 'default' : 'secondary'}>
              {offer.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {offer.is_featured && (
              <Badge variant="secondary" className="text-xs">Featured</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
