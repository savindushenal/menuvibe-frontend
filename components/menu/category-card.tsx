'use client';

import { motion } from 'framer-motion';
import { GripVertical, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MenuCategory } from '@/lib/types';

interface CategoryCardProps {
  category: MenuCategory;
  itemCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
}

export function CategoryCard({
  category,
  itemCount,
  onEdit,
  onDelete,
  onAddItem,
}: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-neutral-200 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-3">
            <div className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                {category.name}
              </CardTitle>
              {category.description && (
                <p className="text-sm text-neutral-500 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="hover:bg-emerald-50 hover:text-emerald-600"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <Button
              onClick={onAddItem}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
