'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Spinner } from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, X, Upload, Flame } from 'lucide-react';
import { MenuItem, MenuCategory } from '@/lib/types';
import { InlineFeatureBlock } from '@/components/subscription/inline-feature-block';
import { ItemVariantsForm, ItemVariant } from './item-variants-form';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.number(),
  compare_at_price: z.number().optional(),
  is_default: z.boolean().optional(),
});

const menuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('USD'),
  category_id: z.number().min(1, 'Category is required'),
  image_url: z.string().optional(),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_spicy: z.boolean().default(false),
  spice_level: z.number().min(0).max(5).optional(),
  preparation_time: z.number().min(0).optional(),
  allergens: z.array(z.string()).default([]),
  dietary_info: z.array(z.string()).default([]),
  variations: z.array(variantSchema).default([]),
  sort_order: z.number().default(0),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItemFormProps {
  menuId: number;
  item?: MenuItem | null;
  categories: MenuCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MenuItemFormData, image?: File) => Promise<void>;
  onCreateCategory: () => void;
  isLoading?: boolean;
}

const COMMON_ALLERGENS = [
  'Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy', 'Fish', 'Shellfish'
];

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb', 'Halal', 'Kosher'
];

export function MenuItemForm({ 
  menuId, 
  item, 
  categories,
  isOpen, 
  onClose, 
  onSubmit,
  onCreateCategory,
  isLoading = false 
}: MenuItemFormProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(item?.image_url || '');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(item?.allergens || []);
  const [selectedDietary, setSelectedDietary] = useState<string[]>(item?.dietary_info || []);
  const [variants, setVariants] = useState<ItemVariant[]>((item?.variations as ItemVariant[]) || []);

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      price: (item?.price ? Number(item.price) : 0) as number,
      currency: item?.currency || 'USD',
      category_id: item?.category_id || (categories.length > 0 ? categories[0].id : 0),
      image_url: item?.image_url || '',
      is_available: item?.is_available ?? true,
      is_featured: item?.is_featured ?? false,
      is_spicy: item?.is_spicy ?? false,
      spice_level: item?.spice_level || 0,
      preparation_time: item?.preparation_time || 0,
      allergens: item?.allergens || [],
      dietary_info: item?.dietary_info || [],
      variations: (item?.variations as ItemVariant[]) || [],
      sort_order: item?.sort_order || 0,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    form.setValue('image_url', '');
  };

  const toggleAllergen = (allergen: string) => {
    const updated = selectedAllergens.includes(allergen)
      ? selectedAllergens.filter(a => a !== allergen)
      : [...selectedAllergens, allergen];
    setSelectedAllergens(updated);
    form.setValue('allergens', updated);
  };

  const toggleDietary = (dietary: string) => {
    const updated = selectedDietary.includes(dietary)
      ? selectedDietary.filter(d => d !== dietary)
      : [...selectedDietary, dietary];
    setSelectedDietary(updated);
    form.setValue('dietary_info', updated);
  };

  const handleVariantsChange = (newVariants: ItemVariant[]) => {
    setVariants(newVariants);
    form.setValue('variations', newVariants);
  };

  const handleFormSubmit = async (data: MenuItemFormData) => {
    try {
      // Include variants in submission
      const submitData = {
        ...data,
        variations: variants,
      };
      await onSubmit(submitData, selectedImage || undefined);
      form.reset();
      setSelectedImage(null);
      setImagePreview('');
      setSelectedAllergens([]);
      setSelectedDietary([]);
      setVariants([]);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const isSpicy = form.watch('is_spicy');
  const currentPrice = form.watch('price');
  const currentCurrency = form.watch('currency');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit Menu Item' : 'Add New Menu Item'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Margherita Pizza" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the dish, ingredients, cooking method..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category Selection */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <div className="flex gap-2">
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.length === 0 ? (
                            <div className="p-4 text-sm text-neutral-500 text-center">
                              No categories yet
                            </div>
                          ) : (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: category.background_color }}
                                  />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onCreateCategory}
                        title="Create new category"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'USD'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="USD" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="CAD">CAD ($)</SelectItem>
                          <SelectItem value="AUD">AUD ($)</SelectItem>
                          <SelectItem value="CHF">CHF (Fr)</SelectItem>
                          <SelectItem value="CNY">CNY (¥)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="SGD">SGD ($)</SelectItem>
                          <SelectItem value="HKD">HKD ($)</SelectItem>
                          <SelectItem value="NZD">NZD ($)</SelectItem>
                          <SelectItem value="SEK">SEK (kr)</SelectItem>
                          <SelectItem value="NOK">NOK (kr)</SelectItem>
                          <SelectItem value="DKK">DKK (kr)</SelectItem>
                          <SelectItem value="MXN">MXN ($)</SelectItem>
                          <SelectItem value="BRL">BRL (R$)</SelectItem>
                          <SelectItem value="ZAR">ZAR (R)</SelectItem>
                          <SelectItem value="AED">AED (د.إ)</SelectItem>
                          <SelectItem value="SAR">SAR (﷼)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preparation_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Time (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="15"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Image</h3>
              
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative w-full h-48 bg-neutral-100 rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-48 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                      <p className="text-sm text-neutral-500">Click to upload image</p>
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            </div>

            {/* Size Variants */}
            <ItemVariantsForm
              variants={variants}
              onChange={handleVariantsChange}
              currency={currentCurrency}
              basePrice={currentPrice}
            />

            {/* Spice Level */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Spice Level</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_spicy"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Flame className="h-4 w-4 text-red-500" />
                        <FormLabel>Spicy Item</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isSpicy && (
                  <FormField
                    control={form.control}
                    name="spice_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spice Level (1-5)</FormLabel>
                        <Select 
                          value={field.value?.toString()} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select spice level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">🌶️ Mild</SelectItem>
                            <SelectItem value="2">🌶️🌶️ Medium</SelectItem>
                            <SelectItem value="3">🌶️🌶️🌶️ Hot</SelectItem>
                            <SelectItem value="4">🌶️🌶️🌶️🌶️ Very Hot</SelectItem>
                            <SelectItem value="5">🌶️🌶️🌶️🌶️🌶️ Extreme</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Allergens */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Allergens</h3>
              <div className="flex flex-wrap gap-2">
                {COMMON_ALLERGENS.map((allergen) => (
                  <Badge
                    key={allergen}
                    variant={selectedAllergens.includes(allergen) ? "destructive" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleAllergen(allergen)}
                  >
                    {allergen}
                    {selectedAllergens.includes(allergen) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Dietary Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dietary Information</h3>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((dietary) => (
                  <Badge
                    key={dietary}
                    variant={selectedDietary.includes(dietary) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDietary(dietary)}
                  >
                    {dietary}
                    {selectedDietary.includes(dietary) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Availability and Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Availability & Features</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_available"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Available</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Featured Item</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading && <Spinner size="sm" className="mr-2" />}
                {isLoading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}