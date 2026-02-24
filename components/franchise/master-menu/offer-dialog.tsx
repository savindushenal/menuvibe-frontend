'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, CalendarIcon, Sparkles, Zap, Calendar as CalendarIconAlt, Tag, Clock, MapPin, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Offer {
  id: number;
  title: string;
  description: string | null;
  offer_type: 'special' | 'instant' | 'seasonal' | 'combo' | 'happy_hour';
  discount_type: 'percentage' | 'fixed_amount' | 'bogo' | 'bundle_price';
  discount_value: number | null;
  image_url: string | null;
  badge_text: string | null;
  badge_color: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  is_featured: boolean;
  minimum_order: number | null;
  apply_to_all: boolean;
  branch_overrides?: { location_id: number; is_active: boolean }[];
}

interface Branch {
  id: number;
  name: string;
  branch_name?: string;
}

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer | null;
  franchiseId: number | null;
  menuId: number;
  currency: string;
  branches?: Branch[];
  onSuccess: () => void;
}

const OFFER_TYPES = [
  { value: 'special', label: 'Special Offer', icon: Sparkles, description: 'Limited time promotions' },
  { value: 'instant', label: 'Instant Deal', icon: Zap, description: 'Immediate discounts' },
  { value: 'seasonal', label: 'Seasonal', icon: CalendarIconAlt, description: 'Holiday/season specials' },
  { value: 'combo', label: 'Combo Deal', icon: Tag, description: 'Bundle pricing' },
  { value: 'happy_hour', label: 'Happy Hour', icon: Clock, description: 'Time-based offers' },
];

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage Off (%)' },
  { value: 'fixed_amount', label: 'Fixed Amount Off' },
  { value: 'bogo', label: 'Buy One Get One' },
  { value: 'bundle_price', label: 'Bundle Price' },
];

export function OfferDialog({ 
  open, 
  onOpenChange, 
  offer, 
  franchiseId, 
  menuId, 
  currency,
  branches = [],
  onSuccess 
}: OfferDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    offer_type: 'special' as Offer['offer_type'],
    discount_type: 'percentage' as Offer['discount_type'],
    discount_value: '',
    bundle_price: '',
    minimum_order: '',
    image_url: '',
    badge_text: '',
    badge_color: '#f59e0b',
    starts_at: null as Date | null,
    ends_at: null as Date | null,
    is_active: true,
    is_featured: false,
    apply_to_all: true,
    selectedBranchIds: [] as number[],
  });

  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        offer_type: offer.offer_type || 'special',
        discount_type: offer.discount_type || 'percentage',
        discount_value: offer.discount_value?.toString() || '',
        bundle_price: '',
        minimum_order: offer.minimum_order?.toString() || '',
        image_url: offer.image_url || '',
        badge_text: offer.badge_text || '',
        badge_color: offer.badge_color || '#f59e0b',
        starts_at: offer.starts_at ? new Date(offer.starts_at) : null,
        ends_at: offer.ends_at ? new Date(offer.ends_at) : null,
        is_active: offer.is_active ?? true,
        is_featured: offer.is_featured ?? false,
        apply_to_all: offer.apply_to_all ?? true,
        selectedBranchIds: offer.branch_overrides
          ? offer.branch_overrides.filter(o => o.is_active).map(o => o.location_id)
          : [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        offer_type: 'special',
        discount_type: 'percentage',
        discount_value: '',
        bundle_price: '',
        minimum_order: '',
        image_url: '',
        badge_text: '',
        badge_color: '#f59e0b',
        starts_at: null,
        ends_at: null,
        is_active: true,
        is_featured: false,
        apply_to_all: true,
        selectedBranchIds: [],
      });
    }
  }, [offer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!franchiseId) {
      toast.error('Franchise ID not found');
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Please enter an offer title');
      return;
    }
    
    if (formData.discount_type !== 'bogo' && !formData.discount_value) {
      toast.error('Please enter a discount value');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        title: formData.title,
        description: formData.description || null,
        offer_type: formData.offer_type,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        bundle_price: formData.bundle_price ? parseFloat(formData.bundle_price) : null,
        minimum_order: formData.minimum_order ? parseFloat(formData.minimum_order) : null,
        image_url: formData.image_url || null,
        badge_text: formData.badge_text || null,
        badge_color: formData.badge_color || null,
        starts_at: formData.starts_at ? formData.starts_at.toISOString() : null,
        ends_at: formData.ends_at ? formData.ends_at.toISOString() : null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        apply_to_all: formData.apply_to_all,
      };
      
      const endpoint = offer 
        ? `/franchises/${franchiseId}/master-menus/${menuId}/offers/${offer.id}`
        : `/franchises/${franchiseId}/master-menus/${menuId}/offers`;
      
      const method = offer ? 'put' : 'post';
      const response = await api[method](endpoint, payload);
      
      if (response.data.success) {
        const savedOffer = response.data.data;
        const savedOfferId = savedOffer?.id ?? offer?.id;

        // Handle branch overrides when not apply_to_all
        if (!formData.apply_to_all && savedOfferId && franchiseId) {
          const prevIds = offer?.branch_overrides
            ? offer.branch_overrides.filter(o => o.is_active).map(o => o.location_id)
            : [];
          const toAdd = formData.selectedBranchIds.filter(id => !prevIds.includes(id));
          const toRemove = prevIds.filter(id => !formData.selectedBranchIds.includes(id));

          await Promise.allSettled([
            ...toAdd.map(branchId =>
              api.post(`/franchises/${franchiseId}/master-menus/${menuId}/offers/${savedOfferId}/override/${branchId}`, { is_active: true })
            ),
            ...toRemove.map(branchId =>
              api.delete(`/franchises/${franchiseId}/master-menus/${menuId}/offers/${savedOfferId}/override/${branchId}`)
            ),
          ]);
        }

        toast.success(offer ? 'Offer updated successfully' : 'Offer created successfully');
        onSuccess();
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error('Failed to save offer:', err);
      toast.error(err.response?.data?.message || 'Failed to save offer');
    } finally {
      setLoading(false);
    }
  };

  const selectedOfferType = OFFER_TYPES.find(t => t.value === formData.offer_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{offer ? 'Edit Offer' : 'Create Offer'}</DialogTitle>
            <DialogDescription>
              {offer ? 'Update the offer details.' : 'Create a new promotional offer for your menu.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Offer Type Selection */}
            <div className="space-y-2">
              <Label>Offer Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {OFFER_TYPES.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                        formData.offer_type === type.value
                          ? "border-primary bg-primary/5"
                          : "border-neutral-200 hover:border-neutral-300"
                      )}
                      onClick={() => setFormData({ ...formData, offer_type: type.value as Offer['offer_type'] })}
                    >
                      <IconComponent className={cn(
                        "h-5 w-5 mb-1",
                        formData.offer_type === type.value ? "text-primary" : "text-neutral-500"
                      )} />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedOfferType && (
                <p className="text-xs text-neutral-500">{selectedOfferType.description}</p>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Offer Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Special - 20% Off All Drinks"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the offer details and terms..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows={2}
                />
              </div>
            </div>

            {/* Discount Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData({ ...formData, discount_type: value as Offer['discount_type'] })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCOUNT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.discount_type !== 'bogo' && (
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    {formData.discount_type === 'percentage' ? 'Discount Percentage' : 
                     formData.discount_type === 'bundle_price' ? `Bundle Price (${currency})` : 
                     `Discount Amount (${currency})`}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    placeholder={formData.discount_type === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            {/* Minimum Order */}
            <div className="space-y-2">
              <Label htmlFor="minimum_order">Minimum Order Amount ({currency}) - Optional</Label>
              <Input
                id="minimum_order"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave empty for no minimum"
                value={formData.minimum_order}
                onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.starts_at && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.starts_at ? format(formData.starts_at, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.starts_at || undefined}
                      onSelect={(date) => setFormData({ ...formData, starts_at: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.ends_at && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.ends_at ? format(formData.ends_at, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.ends_at || undefined}
                      onSelect={(date) => setFormData({ ...formData, ends_at: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Badge & Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badge_text">Badge Text</Label>
                <Input
                  id="badge_text"
                  placeholder="e.g., 20% OFF, NEW, LIMITED"
                  value={formData.badge_text}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge_color">Badge Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="badge_color"
                    type="color"
                    value={formData.badge_color}
                    onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                    disabled={loading}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.badge_color}
                    onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                    disabled={loading}
                    placeholder="#f59e0b"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Banner Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  disabled={loading}
                  className="flex-1"
                />
                {formData.image_url && (
                  <div className="h-10 w-20 rounded overflow-hidden flex-shrink-0 border">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-neutral-500">Offer is live</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Featured</Label>
                  <p className="text-xs text-neutral-500">Highlight offer</p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>All Branches</Label>
                  <p className="text-xs text-neutral-500">Show on all branches</p>
                </div>
                <Switch
                  checked={formData.apply_to_all}
                  onCheckedChange={(checked) => setFormData({ ...formData, apply_to_all: checked, selectedBranchIds: [] })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Branch selector (only when apply_to_all is off) */}
            {!formData.apply_to_all && branches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-neutral-500" />
                  <Label>Select Branches</Label>
                  <span className="text-xs text-neutral-400">({formData.selectedBranchIds.length} selected)</span>
                </div>
                <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                  {branches.map((branch) => {
                    const checked = formData.selectedBranchIds.includes(branch.id);
                    return (
                      <label
                        key={branch.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-neutral-50 transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val) => {
                            const ids = val
                              ? [...formData.selectedBranchIds, branch.id]
                              : formData.selectedBranchIds.filter(id => id !== branch.id);
                            setFormData({ ...formData, selectedBranchIds: ids });
                          }}
                          disabled={loading}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{branch.name}</p>
                          {branch.branch_name && branch.branch_name !== branch.name && (
                            <p className="text-xs text-neutral-400">{branch.branch_name}</p>
                          )}
                        </div>
                        {checked && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                      </label>
                    );
                  })}
                </div>
                {formData.selectedBranchIds.length === 0 && (
                  <p className="text-xs text-amber-600">No branches selected — offer won't show anywhere.</p>
                )}
              </div>
            )}

            {!formData.apply_to_all && branches.length === 0 && (
              <p className="text-xs text-neutral-500 rounded-lg border p-3">
                No branches found. The offer won't show unless branches are configured.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {offer ? 'Update Offer' : 'Create Offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
