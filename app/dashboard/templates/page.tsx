'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  FileText,
  Edit2,
  Trash2,
  Copy,
  MoreVertical,
  TableProperties,
  Eye,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/contexts/location-context';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/loading/spinner';

interface MenuTemplate {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  is_active: boolean;
  is_default: boolean;
  image_url: string | null;
  categories_count?: number;
  items_count?: number;
  endpoints_count?: number;
  created_at: string;
  updated_at: string;
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    currency: 'USD',
  });
  const [duplicateName, setDuplicateName] = useState('');
  const { toast } = useToast();
  const { currentLocation } = useLocation();

  useEffect(() => {
    loadTemplates();
  }, [currentLocation]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMenuTemplates(currentLocation?.id ? parseInt(currentLocation.id) : undefined);
      if (response.success) {
        // Handle both response formats: { data: [...] } or { data: { templates: [...] } }
        const templateData = Array.isArray(response.data) ? response.data : (response.data?.templates || []);
        setTemplates(templateData);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await apiClient.createMenuTemplate({
        ...formData,
        location_id: currentLocation?.id ? parseInt(currentLocation.id) : undefined,
      });
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Template created successfully',
        });
        setIsCreateOpen(false);
        setFormData({ name: '', description: '', currency: 'USD' });
        loadTemplates();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;
    try {
      const response = await apiClient.updateMenuTemplate(selectedTemplate.id, formData);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Template updated successfully',
        });
        setIsEditOpen(false);
        setSelectedTemplate(null);
        loadTemplates();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update template',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      const response = await apiClient.deleteMenuTemplate(selectedTemplate.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Template deleted successfully',
        });
        setIsDeleteOpen(false);
        setSelectedTemplate(null);
        loadTemplates();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async () => {
    if (!selectedTemplate) return;
    try {
      const response = await apiClient.duplicateMenuTemplate(selectedTemplate.id, {
        name: duplicateName,
      });
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Template duplicated successfully',
        });
        setIsDuplicateOpen(false);
        setSelectedTemplate(null);
        setDuplicateName('');
        loadTemplates();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to duplicate template',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (template: MenuTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      currency: template.currency,
    });
    setIsEditOpen(true);
  };

  const openDuplicateDialog = (template: MenuTemplate) => {
    setSelectedTemplate(template);
    setDuplicateName(`${template.name} (Copy)`);
    setIsDuplicateOpen(true);
  };

  const openDeleteDialog = (template: MenuTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteOpen(true);
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Menu Templates</h1>
          <p className="text-neutral-500 mt-1">
            Create reusable menu templates for tables, rooms, and branches
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: '', description: '', currency: 'USD' });
            setIsCreateOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No Templates Yet</h3>
          <p className="text-neutral-500 mb-6">
            Create your first menu template to get started
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {template.name}
                          {template.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {template.description || 'No description'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/templates/${template.id}`}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Template
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(template)}>
                            <Settings2 className="w-4 h-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDuplicateDialog(template)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(template)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{template.categories_count || 0} categories</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TableProperties className="w-4 h-4" />
                        <span>{template.endpoints_count || 0} endpoints</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={template.is_active ? 'default' : 'secondary'}
                        className={template.is_active ? 'bg-emerald-100 text-emerald-700' : ''}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{template.currency}</Badge>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/templates/${template.id}`}>
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/endpoints?template_id=${template.id}`}>
                          <TableProperties className="w-3 h-3 mr-1" />
                          Endpoints
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Menu Template</DialogTitle>
            <DialogDescription>
              Create a reusable menu template for your tables, rooms, or branches
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Menu, Lunch Menu, VIP Menu"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this template..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template Settings</DialogTitle>
            <DialogDescription>Update the template name, description, and currency</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Template Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-currency">Currency</Label>
              <select
                id="edit-currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={isDuplicateOpen} onOpenChange={setIsDuplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Template</DialogTitle>
            <DialogDescription>
              Create a copy of "{selectedTemplate?.name}" with all categories and items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Template Name *</Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDuplicateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDuplicate}
              disabled={!duplicateName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be
              undone. All categories, items, and associated endpoints will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
