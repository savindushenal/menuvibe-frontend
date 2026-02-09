'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Loader2,
  Edit,
  Trash2,
  MoreHorizontal,
  QrCode,
  Eye,
  Palette,
  Menu as MenuIcon,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface Template {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  is_active: boolean;
  settings: {
    template_type?: string;
    show_prices?: boolean;
    show_images?: boolean;
    currency_symbol?: string;
  };
  categories_count?: number;
  items_count?: number;
  endpoints_count?: number;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  items_count?: number;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  icon: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  category_id: number;
}

interface Endpoint {
  id: number;
  name: string;
  short_code: string;
  table_number: string | null;
  is_active: boolean;
  location: {
    id: number;
    name: string;
  };
  template?: {
    id: number;
    name: string;
  };
  created_at: string;
}

interface Location {
  id: number;
  name: string;
  address?: string;
  city?: string;
}

export function TemplatesTab({ franchiseId }: { franchiseId: number }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [branches, setBranches] = useState<Location[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Dialogs
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showDesignTokens, setShowDesignTokens] = useState(false);
  const [showCreateEndpoint, setShowCreateEndpoint] = useState(false);
  const [showBulkEndpoints, setShowBulkEndpoints] = useState(false);

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    currency: 'LKR',
    template_type: 'custom',
    show_prices: true,
    show_images: true,
    currency_symbol: 'LKR',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
  });

  const [itemForm, setItemForm] = useState({
    category_id: 0,
    name: '',
    description: '',
    price: 0,
    image_url: '',
    icon: '',
    is_available: true,
    is_featured: false,
  });

  const [endpointForm, setEndpointForm] = useState({
    location_id: 0,
    name: '',
    table_number: '',
  });

  const [bulkEndpointForm, setBulkEndpointForm] = useState({
    location_id: 0,
    table_prefix: 'T',
    table_start: 1,
    table_end: 10,
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [templatesRes, branchesRes] = await Promise.all([
          apiClient.getFranchiseMenus(franchiseId),
          apiClient.getFranchiseBranches(franchiseId)
        ]);
        if (isMounted && templatesRes.success && templatesRes.data) {
          setTemplates(templatesRes.data);
          if (templatesRes.data.length > 0 && !selectedTemplate) {
            setSelectedTemplate(templatesRes.data[0]);
          }
        }
        if (isMounted && branchesRes.success && branchesRes.data) {
          setBranches(branchesRes.data);
        }
      } catch (error) {
        if (isMounted) {
          toast({
            title: 'Error',
            description: 'Failed to load templates',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => { isMounted = false; };
  }, [franchiseId]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (selectedTemplate) {
        try {
          const [categoriesRes, itemsRes, endpointsRes] = await Promise.all([
            apiClient.getFranchiseCategories(franchiseId, selectedTemplate.id),
            apiClient.getFranchiseItems(franchiseId, selectedTemplate.id),
            apiClient.getFranchiseEndpoints(franchiseId)
          ]);
          if (isMounted) {
            if (categoriesRes.success && categoriesRes.data) {
              setCategories(categoriesRes.data);
            }
            if (itemsRes.success && itemsRes.data) {
              setItems(itemsRes.data);
            }
            if (endpointsRes.success && endpointsRes.data) {
              // Filter endpoints by selected template
              const templateEndpoints = endpointsRes.data.filter(
                (ep: Endpoint) => ep.template?.id === selectedTemplate.id
              );
              setEndpoints(templateEndpoints);
            }
          }
        } catch (error) {
          console.error('Failed to load template data:', error);
        }
      } else {
        if (isMounted) {
          setCategories([]);
          setItems([]);
          setEndpoints([]);
        }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [selectedTemplate?.id, franchiseId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getFranchiseMenus(franchiseId);
      if (response.success && response.data) {
        setTemplates(response.data);
        if (response.data.length > 0 && !selectedTemplate) {
          setSelectedTemplate(response.data[0]);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (templateId: number) => {
    try {
      const response = await apiClient.getFranchiseCategories(franchiseId, templateId);
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const loadItems = async (templateId: number) => {
    try {
      const response = await apiClient.getFranchiseItems(franchiseId, templateId);
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to load items:', error);
      setItems([]);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name) {
      toast({
        title: 'Validation Error',
        description: 'Template name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.createFranchiseMenu(franchiseId, {
        name: templateForm.name,
        description: templateForm.description || undefined,
        currency: templateForm.currency,
        settings: {
          template_type: templateForm.template_type,
          show_prices: templateForm.show_prices,
          show_images: templateForm.show_images,
          currency_symbol: templateForm.currency_symbol,
        },
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Template created successfully',
        });
        setShowCreateTemplate(false);
        setTemplateForm({
          name: '',
          description: '',
          currency: 'LKR',
          template_type: 'custom',
          show_prices: true,
          show_images: true,
          currency_symbol: 'LKR',
        });
        loadTemplates();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!selectedTemplate || !categoryForm.name) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.createFranchiseCategory(franchiseId, selectedTemplate.id, {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        icon: categoryForm.icon || undefined,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
        setShowCreateCategory(false);
        setCategoryForm({ name: '', description: '', icon: '' });
        loadCategories(selectedTemplate.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    }
  };

  const handleCreateItem = async () => {
    if (!selectedTemplate || !itemForm.name || !itemForm.category_id) {
      toast({
        title: 'Validation Error',
        description: 'Item name and category are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.createFranchiseItem(franchiseId, selectedTemplate.id, {
        category_id: itemForm.category_id,
        name: itemForm.name,
        description: itemForm.description || undefined,
        price: itemForm.price,
        image_url: itemForm.image_url || undefined,
        icon: itemForm.icon || undefined,
        is_available: itemForm.is_available,
        is_featured: itemForm.is_featured,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Menu item created successfully',
        });
        setShowCreateItem(false);
        setItemForm({
          category_id: 0,
          name: '',
          description: '',
          price: 0,
          image_url: '',
          icon: '',
          is_available: true,
          is_featured: false,
        });
        loadItems(selectedTemplate.id);
        loadCategories(selectedTemplate.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create menu item',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiClient.deleteFranchiseMenu(franchiseId, templateId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Template deleted successfully',
        });
        loadTemplates();
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!selectedTemplate || !confirm('Delete this category? All items in this category will be deleted.')) {
      return;
    }

    try {
      const response = await apiClient.deleteFranchiseCategory(franchiseId, selectedTemplate.id, categoryId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Category deleted successfully',
        });
        loadCategories(selectedTemplate.id);
        loadItems(selectedTemplate.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!selectedTemplate || !confirm('Delete this menu item?')) {
      return;
    }

    try {
      const response = await apiClient.deleteFranchiseItem(franchiseId, selectedTemplate.id, itemId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Menu item deleted successfully',
        });
        loadItems(selectedTemplate.id);
        loadCategories(selectedTemplate.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete menu item',
        variant: 'destructive',
      });
    }
  };

  const handleCreateEndpoint = async () => {
    if (!selectedTemplate || !endpointForm.location_id || !endpointForm.name) {
      toast({
        title: 'Validation Error',
        description: 'Location and endpoint name are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.createFranchiseEndpoint(franchiseId, {
        location_id: endpointForm.location_id,
        menu_template_id: selectedTemplate.id,
        name: endpointForm.name,
        table_number: endpointForm.table_number || undefined,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'QR endpoint created successfully',
        });
        setShowCreateEndpoint(false);
        setEndpointForm({ location_id: 0, name: '', table_number: '' });
        loadEndpoints();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create endpoint',
        variant: 'destructive',
      });
    }
  };

  const handleBulkCreateEndpoints = async () => {
    if (!selectedTemplate || !bulkEndpointForm.location_id) {
      toast({
        title: 'Validation Error',
        description: 'Location is required',
        variant: 'destructive',
      });
      return;
    }

    if (bulkEndpointForm.table_end <= bulkEndpointForm.table_start) {
      toast({
        title: 'Validation Error',
        description: 'End table number must be greater than start',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.createBulkFranchiseEndpoints(franchiseId, {
        menu_template_id: selectedTemplate.id,
        location_id: bulkEndpointForm.location_id,
        table_prefix: bulkEndpointForm.table_prefix,
        table_start: bulkEndpointForm.table_start,
        table_end: bulkEndpointForm.table_end,
      });

      if (response.success) {
        const count = bulkEndpointForm.table_end - bulkEndpointForm.table_start + 1;
        toast({
          title: 'Success',
          description: `${count} QR endpoints created successfully`,
        });
        setShowBulkEndpoints(false);
        setBulkEndpointForm({ location_id: 0, table_prefix: 'T', table_start: 1, table_end: 10 });
        loadEndpoints();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create endpoints',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEndpoint = async (endpointId: number) => {
    if (!confirm('Delete this QR endpoint?')) {
      return;
    }

    try {
      const response = await apiClient.deleteFranchiseEndpoint(franchiseId, endpointId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Endpoint deleted successfully',
        });
        loadEndpoints();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete endpoint',
        variant: 'destructive',
      });
    }
  };

  const loadEndpoints = async () => {
    if (!selectedTemplate) return;
    try {
      const response = await apiClient.getFranchiseEndpoints(franchiseId);
      if (response.success && response.data) {
        const templateEndpoints = response.data.filter(
          (ep: Endpoint) => ep.template?.id === selectedTemplate.id
        );
        setEndpoints(templateEndpoints);
      }
    } catch (error) {
      console.error('Failed to load endpoints:', error);
    }
  };

  const copyQRUrl = (shortCode: string) => {
    const url = `${window.location.origin}/m/${shortCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(shortCode);
    toast({
      title: 'Copied!',
      description: 'QR code URL copied to clipboard',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Templates List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Menu Templates</CardTitle>
            <CardDescription>
              Manage franchise menu templates, categories, and items
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateTemplate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MenuIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates yet. Create your first menu template.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(template);
                            setShowDesignTokens(true);
                          }}>
                            <Palette className="h-4 w-4 mr-2" />
                            Design Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                      <div className="flex items-center gap-1">
                        <MenuIcon className="h-3 w-3" />
                        {template.categories_count || 0} categories
                      </div>
                      <div className="flex items-center gap-1">
                        {template.items_count || 0} items
                      </div>
                    </div>
                    {template.settings?.template_type && (
                      <Badge variant="outline" className="mt-2">
                        {template.settings.template_type}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Template Details */}
      {selectedTemplate && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Categories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Categories</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowCreateCategory(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No categories yet
                </p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {category.icon && <span className="text-2xl">{category.icon}</span>}
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.items_count || 0} items
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menu Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Menu Items</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowCreateItem(true)}
                disabled={categories.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {categories.length === 0
                    ? 'Create categories first'
                    : 'No menu items yet'}
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {item.icon && <span>{item.icon}</span>}
                          <p className="font-medium">{item.name}</p>
                          {!item.is_available && (
                            <Badge variant="secondary" className="text-xs">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedTemplate.settings?.currency_symbol || item.currency}{' '}
                          {parseFloat(item.price.toString()).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Endpoints Section */}
      {selectedTemplate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">QR Code Endpoints</CardTitle>
              <CardDescription>
                Generate QR codes for different locations and tables
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkEndpoints(true)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Bulk Create
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateEndpoint(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Endpoint
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {endpoints.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No endpoints created yet. Create endpoints to generate QR codes for your locations.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {endpoints.map((endpoint) => (
                  <Card key={endpoint.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{endpoint.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {endpoint.location.name}
                          </p>
                          {endpoint.table_number && (
                            <p className="text-xs text-muted-foreground">
                              Table: {endpoint.table_number}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEndpoint(endpoint.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs font-mono">
                        <code className="flex-1 truncate">/m/{endpoint.short_code}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyQRUrl(endpoint.short_code)}
                        >
                          {copiedCode === endpoint.short_code ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => window.open(`/m/${endpoint.short_code}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Preview
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Template Dialog */}
      <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Menu Template</DialogTitle>
            <DialogDescription>
              Create a new menu template for this franchise
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, name: e.target.value })
                }
                placeholder="e.g., Main Menu, Lunch Menu"
              />
            </div>
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={templateForm.description}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, description: e.target.value })
                }
                placeholder="Brief description of this menu"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-type">Template Type</Label>
                <Select
                  value={templateForm.template_type}
                  onValueChange={(value) =>
                    setTemplateForm({ ...templateForm, template_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="barista">Barista</SelectItem>
                    <SelectItem value="isso">Isso Seafood</SelectItem>
                    <SelectItem value="pizzahut">Pizza Hut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency-symbol">Currency Symbol</Label>
                <Input
                  id="currency-symbol"
                  value={templateForm.currency_symbol}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, currency_symbol: e.target.value })
                  }
                  placeholder="LKR"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTemplate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Add a new category to {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="e.g., Appetizers, Main Dishes"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, description: e.target.value })
                }
                placeholder="Brief description"
              />
            </div>
            <div>
              <Label htmlFor="category-icon">Icon (Emoji)</Label>
              <Input
                id="category-icon"
                value={categoryForm.icon}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, icon: e.target.value })
                }
                placeholder="🍕 🍔 🍜"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Item Dialog */}
      <Dialog open={showCreateItem} onOpenChange={setShowCreateItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>
              Add a new item to {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-category">Category *</Label>
              <Select
                value={itemForm.category_id.toString()}
                onValueChange={(value) =>
                  setItemForm({ ...itemForm, category_id: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="item-name">Item Name *</Label>
              <Input
                id="item-name"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
                placeholder="e.g., Margherita Pizza"
              />
            </div>
            <div>
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm({ ...itemForm, description: e.target.value })
                }
                placeholder="Item description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-price">Price *</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  value={itemForm.price}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="item-icon">Icon (Emoji)</Label>
                <Input
                  id="item-icon"
                  value={itemForm.icon}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, icon: e.target.value })
                  }
                  placeholder="🍕"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="item-image">Image URL</Label>
              <Input
                id="item-image"
                value={itemForm.image_url}
                onChange={(e) =>
                  setItemForm({ ...itemForm, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateItem(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Endpoint Dialog */}
      <Dialog open={showCreateEndpoint} onOpenChange={setShowCreateEndpoint}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create QR Endpoint</DialogTitle>
            <DialogDescription>
              Create a QR code endpoint for a specific location
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="endpoint-location">Location *</Label>
              <Select
                value={endpointForm.location_id.toString()}
                onValueChange={(value) =>
                  setEndpointForm({ ...endpointForm, location_id: parseInt(value) })
                }
              >
                <SelectTrigger id="endpoint-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="endpoint-name">Endpoint Name *</Label>
              <Input
                id="endpoint-name"
                value={endpointForm.name}
                onChange={(e) =>
                  setEndpointForm({ ...endpointForm, name: e.target.value })
                }
                placeholder="e.g., Table 1, Main Counter"
              />
            </div>
            <div>
              <Label htmlFor="endpoint-table">Table Number (Optional)</Label>
              <Input
                id="endpoint-table"
                value={endpointForm.table_number}
                onChange={(e) =>
                  setEndpointForm({ ...endpointForm, table_number: e.target.value })
                }
                placeholder="e.g., T01, A1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateEndpoint(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEndpoint}>Create Endpoint</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Endpoints Dialog */}
      <Dialog open={showBulkEndpoints} onOpenChange={setShowBulkEndpoints}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Create QR Endpoints</DialogTitle>
            <DialogDescription>
              Create multiple numbered endpoints at once (e.g., Table 1-20)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-location">Location *</Label>
              <Select
                value={bulkEndpointForm.location_id.toString()}
                onValueChange={(value) =>
                  setBulkEndpointForm({ ...bulkEndpointForm, location_id: parseInt(value) })
                }
              >
                <SelectTrigger id="bulk-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bulk-prefix">Table Prefix *</Label>
              <Input
                id="bulk-prefix"
                value={bulkEndpointForm.table_prefix}
                onChange={(e) =>
                  setBulkEndpointForm({ ...bulkEndpointForm, table_prefix: e.target.value })
                }
                placeholder="e.g., T, Table"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-start">Start Number *</Label>
                <Input
                  id="bulk-start"
                  type="number"
                  min="1"
                  value={bulkEndpointForm.table_start}
                  onChange={(e) =>
                    setBulkEndpointForm({ ...bulkEndpointForm, table_start: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="bulk-end">End Number *</Label>
                <Input
                  id="bulk-end"
                  type="number"
                  min="1"
                  value={bulkEndpointForm.table_end}
                  onChange={(e) =>
                    setBulkEndpointForm({ ...bulkEndpointForm, table_end: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="p-3 bg-muted rounded text-sm">
              <p className="font-medium mb-1">Preview:</p>
              <p className="text-muted-foreground">
                Will create {Math.max(0, bulkEndpointForm.table_end - bulkEndpointForm.table_start + 1)} endpoints: 
                <br />
                {bulkEndpointForm.table_prefix}{bulkEndpointForm.table_start} to {bulkEndpointForm.table_prefix}{bulkEndpointForm.table_end}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkEndpoints(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkCreateEndpoints}>
              Create {Math.max(0, bulkEndpointForm.table_end - bulkEndpointForm.table_start + 1)} Endpoints
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
