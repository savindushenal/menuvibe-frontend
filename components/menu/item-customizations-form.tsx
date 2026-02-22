'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, X, GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomizationOption, CustomizationSection } from '@/lib/types';

interface ItemCustomizationsFormProps {
  sections: CustomizationSection[];
  onChange: (sections: CustomizationSection[]) => void;
  currency?: string;
}

export function ItemCustomizationsForm({
  sections,
  onChange,
  currency = 'LKR',
}: ItemCustomizationsFormProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  );

  const addSection = () => {
    const newSection: CustomizationSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      type: 'section',
      required: true,
      min_selections: 1,
      max_selections: 1,
      options: [],
    };
    onChange([...sections, newSection]);
    setExpandedSection(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    onChange(sections.filter(s => s.id !== sectionId));
  };

  const updateSection = (sectionId: string, field: keyof CustomizationSection, value: any) => {
    const updated = sections.map(s =>
      s.id === sectionId ? { ...s, [field]: value } : s
    );
    onChange(updated);
  };

  const addOption = (sectionId: string) => {
    const updated = sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          options: [
            ...s.options,
            {
              id: `option-${Date.now()}`,
              name: 'New Option',
              price_modifier: 0,
            },
          ],
        };
      }
      return s;
    });
    onChange(updated);
  };

  const updateOption = (
    sectionId: string,
    optionId: string,
    field: keyof CustomizationOption,
    value: any
  ) => {
    const updated = sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          options: s.options.map(o =>
            o.id === optionId ? { ...o, [field]: value } : o
          ),
        };
      }
      return s;
    });
    onChange(updated);
  };

  const removeOption = (sectionId: string, optionId: string) => {
    const updated = sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          options: s.options.filter(o => o.id !== optionId),
        };
      }
      return s;
    });
    onChange(updated);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-neutral-500 mb-4">
              No customization sections yet. Add one to let customers personalize this item.
            </p>
            <Button onClick={addSection} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {sections.map((section, idx) => (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader
                  className="pb-3 cursor-pointer hover:bg-neutral-50"
                  onClick={() =>
                    setExpandedSection(
                      expandedSection === section.id ? null : section.id
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="w-4 h-4 text-neutral-400" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{section.name}</h4>
                        <p className="text-xs text-neutral-500">
                          {section.options.length} option{section.options.length !== 1 ? 's' : ''} •{' '}
                          {section.required ? 'Required' : 'Optional'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={section.required ? 'default' : 'secondary'} className="text-xs">
                        {section.required ? 'Required' : 'Optional'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedSection === section.id && (
                  <CardContent className="space-y-4 pt-4 border-t">
                    {/* Section Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium">Section Name</Label>
                        <Input
                          placeholder="e.g., Select Base"
                          value={section.name}
                          onChange={e =>
                            updateSection(section.id, 'name', e.target.value)
                          }
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Selection Limit</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Min"
                            value={section.min_selections}
                            onChange={e =>
                              updateSection(section.id, 'min_selections', parseInt(e.target.value))
                            }
                            className="h-8 text-sm"
                          />
                          <span className="text-neutral-500 flex items-center">to</span>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Max"
                            value={section.max_selections}
                            onChange={e =>
                              updateSection(section.id, 'max_selections', parseInt(e.target.value))
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Required Toggle */}
                    <div className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                      <Label className="text-sm font-medium cursor-pointer">
                        Make this section required
                      </Label>
                      <Switch
                        checked={section.required}
                        onCheckedChange={checked =>
                          updateSection(section.id, 'required', checked)
                        }
                      />
                    </div>

                    {/* Options */}
                    <div>
                      <Label className="text-xs font-medium mb-2 block">Options</Label>
                      <div className="space-y-2">
                        {section.options.length === 0 ? (
                          <p className="text-xs text-neutral-500 py-2">No options yet</p>
                        ) : (
                          section.options.map((option, optIdx) => (
                            <div key={option.id} className="flex gap-2 items-center">
                              <Input
                                placeholder="Option name"
                                value={option.name}
                                onChange={e =>
                                  updateOption(
                                    section.id,
                                    option.id,
                                    'name',
                                    e.target.value
                                  )
                                }
                                className="h-8 text-sm flex-1"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-neutral-500">+</span>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={option.price_modifier}
                                  onChange={e =>
                                    updateOption(
                                      section.id,
                                      option.id,
                                      'price_modifier',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="h-8 text-sm w-20"
                                />
                                <span className="text-xs text-neutral-500 w-12">
                                  {currency}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  removeOption(section.id, option.id)
                                }
                                className="h-8 w-8"
                              >
                                <X className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(section.id)}
                        className="mt-2 h-8 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Option
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Button onClick={addSection} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </>
      )}
    </div>
  );
}
