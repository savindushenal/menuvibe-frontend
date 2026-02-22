'use client';

import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ItemVariant {
  id?: string;
  name: string;
  price: number;
  compare_at_price?: number;
  is_default?: boolean;
}

interface ItemVariantsFormProps {
  variants: ItemVariant[];
  onChange: (variants: ItemVariant[]) => void;
  currency?: string;
  basePrice?: number;
}

const SUGGESTED_SIZES = [
  { name: 'Small', shortName: 'S' },
  { name: 'Medium', shortName: 'M' },
  { name: 'Large', shortName: 'L' },
  { name: 'Extra Large', shortName: 'XL' },
];

export const ItemVariantsForm = memo(function ItemVariantsFormComponent({ 
  variants, 
  onChange, 
  currency = 'LKR',
  basePrice = 0 
}: ItemVariantsFormProps) {
  const [showSuggestions, setShowSuggestions] = useState(variants.length === 0);

  const addVariant = useCallback((name?: string) => {
    const newVariant: ItemVariant = {
      id: `temp-${Date.now()}`,
      name: name || '',
      price: basePrice,
      is_default: variants.length === 0,
    };
    onChange([...variants, newVariant]);
    setShowSuggestions(false);
  }, [variants, basePrice, onChange]);

  const updateVariant = useCallback((index: number, field: keyof ItemVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }, [variants, onChange]);

  const removeVariant = useCallback((index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    // If removing default, make first one default
    if (variants[index].is_default && updated.length > 0) {
      updated[0].is_default = true;
    }
    onChange(updated);
    if (updated.length === 0) {
      setShowSuggestions(true);
    }
  }, [variants, onChange]);

  const setDefault = useCallback((index: number) => {
    const updated = variants.map((v, i) => ({
      ...v,
      is_default: i === index,
    }));
    onChange(updated);
  }, [variants, onChange]);

  const addSuggestedSizes = useCallback(() => {
    const newVariants: ItemVariant[] = [
      { id: `temp-${Date.now()}-1`, name: 'Small', price: basePrice * 0.8, is_default: false },
      { id: `temp-${Date.now()}-2`, name: 'Medium', price: basePrice, is_default: true },
      { id: `temp-${Date.now()}-3`, name: 'Large', price: basePrice * 1.2, is_default: false },
    ];
    onChange(newVariants);
    setShowSuggestions(false);
  }, [basePrice, onChange]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  }, []);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Size Variants
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              (Optional - like Short, Medium, Large)
            </span>
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addVariant()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Variant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick add suggestions */}
        {showSuggestions && variants.length === 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground mr-2">Quick add:</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addSuggestedSizes}
            >
              S / M / L sizes
            </Button>
            {SUGGESTED_SIZES.map((size) => (
              <Badge
                key={size.name}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => addVariant(size.name)}
              >
                + {size.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Variants list */}
        {variants.length > 0 && (
          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div
                key={variant.id || index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-background",
                  variant.is_default && "border-primary/50 bg-primary/5"
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Variant Name */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      placeholder="e.g., Small, Medium, Large"
                      className="h-9"
                    />
                  </div>
                  
                  {/* Price */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Price ({currency})</Label>
                    <Input
                      type="number"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-9"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  {/* Compare at Price (optional) */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Compare at (optional)</Label>
                    <Input
                      type="number"
                      value={variant.compare_at_price || ''}
                      onChange={(e) => updateVariant(index, 'compare_at_price', parseFloat(e.target.value) || undefined)}
                      placeholder="Original price"
                      className="h-9"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={variant.is_default ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDefault(index)}
                    className="text-xs"
                  >
                    {variant.is_default ? 'Default' : 'Set Default'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview */}
        {variants.length > 0 && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <Label className="text-xs text-muted-foreground mb-2 block">Preview (how it looks to customers):</Label>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant, index) => (
                <div
                  key={variant.id || index}
                  className={cn(
                    "px-3 py-2 rounded-full text-sm border transition-all",
                    variant.is_default
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:border-primary"
                  )}
                >
                  <span className="font-medium">{variant.name || 'Unnamed'}</span>
                  <span className="ml-2 opacity-80">
                    {currency} {formatPrice(variant.price)}
                  </span>
                  {variant.compare_at_price && variant.compare_at_price > variant.price && (
                    <span className="ml-1 line-through text-xs opacity-50">
                      {formatPrice(variant.compare_at_price)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          Add size variants if your item comes in different sizes (e.g., Short, Tall, Grande for coffee).
          The default variant's price will be shown in listings.
        </p>
      </CardContent>
    </Card>
  );
});
