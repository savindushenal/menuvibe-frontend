'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface CustomField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio';
  label: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  enabled: boolean;
  order: number;
  helpText?: string;
}

export default function CustomOrderFormSettings() {
  const { toast } = useToast();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultFields, setDefaultFields] = useState({
    customerName: { enabled: true, required: true, label: 'Full Name', placeholder: 'Enter your name' },
    customerPhone: { enabled: true, required: true, label: 'Phone Number', placeholder: 'Enter your phone number' },
    customerEmail: { enabled: true, required: false, label: 'Email Address', placeholder: 'Enter your email' }
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/order-form');
      const data = await response.json();
      
      if (data.success && data.config) {
        if (data.config.fields) {
          setFields(data.config.fields);
        }
        if (data.config.defaultFields) {
          setDefaultFields(data.config.defaultFields);
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    const newField: CustomField = {
      id: `custom_field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      placeholder: '',
      required: false,
      enabled: true,
      order: fields.length + 1
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<CustomField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const deleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const config = {
        fields: fields.map((f, idx) => ({ ...f, order: idx + 1 })),
        defaultFields
      };

      const response = await fetch('/api/settings/order-form', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Order form configuration saved successfully'
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-neutral-600">Loading configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Contact Fields</CardTitle>
          <p className="text-sm text-neutral-600">Configure standard customer information fields</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(defaultFields).map(([key, config]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <Input
                  value={config.label}
                  onChange={(e) => setDefaultFields({
                    ...defaultFields,
                    [key]: { ...config, label: e.target.value }
                  })}
                  placeholder="Field Label"
                />
                <Input
                  value={config.placeholder || ''}
                  onChange={(e) => setDefaultFields({
                    ...defaultFields,
                    [key]: { ...config, placeholder: e.target.value }
                  })}
                  placeholder="Placeholder text"
                />
              </div>
              <div className="flex items-center gap-4 ml-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.required}
                    onChange={(e) => setDefaultFields({
                      ...defaultFields,
                      [key]: { ...config, required: e.target.checked }
                    })}
                    className="rounded"
                  />
                  Required
                </label>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => setDefaultFields({
                    ...defaultFields,
                    [key]: { ...config, enabled: checked }
                  })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Custom Fields</CardTitle>
            <p className="text-sm text-neutral-600">Add custom fields for POS integration or special requirements</p>
          </div>
          <Button onClick={addField} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <p>No custom fields added yet</p>
              <p className="text-sm mt-2">Click "Add Field" to create a custom form field</p>
            </div>
          ) : (
            fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-neutral-400" />
                    <span className="font-medium text-sm">Field {index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.enabled}
                      onCheckedChange={(checked) => updateField(index, { enabled: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteField(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Field Type</Label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="text">Text Input</option>
                      <option value="textarea">Text Area</option>
                      <option value="select">Dropdown</option>
                      <option value="radio">Radio Buttons</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Field ID</Label>
                    <Input
                      value={field.id}
                      onChange={(e) => updateField(index, { id: e.target.value.replace(/\s/g, '_').toLowerCase() })}
                      className="text-sm"
                      placeholder="field_id"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      className="text-sm"
                      placeholder="e.g., Room Number"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Placeholder</Label>
                    <Input
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      className="text-sm"
                      placeholder="e.g., Enter room number"
                    />
                  </div>
                </div>

                {(field.type === 'select' || field.type === 'radio') && (
                  <div>
                    <Label className="text-xs">Options (comma-separated)</Label>
                    <Input
                      value={field.options?.join(', ') || ''}
                      onChange={(e) => updateField(index, { 
                        options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                      })}
                      className="text-sm"
                      placeholder="e.g., Option 1, Option 2, Option 3"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Help Text (Optional)</Label>
                  <Input
                    value={field.helpText || ''}
                    onChange={(e) => updateField(index, { helpText: e.target.value })}
                    className="text-sm"
                    placeholder="Additional guidance for this field"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="rounded"
                    />
                    Required field
                  </label>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={loadConfig} disabled={saving}>
          Reset
        </Button>
        <Button onClick={saveConfig} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Use Cases</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Hotels</strong>: Add "Room Number" and "Guest Name" fields</li>
            <li>• <strong>Corporate</strong>: Add "Employee ID" and "Department" fields</li>
            <li>• <strong>Delivery</strong>: Add "Delivery Address" and "Delivery Time" fields</li>
            <li>• <strong>POS Integration</strong>: Add custom fields that map to your POS system</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
