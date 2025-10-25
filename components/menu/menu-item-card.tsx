'use client';

import { motion } from 'framer-motion';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MenuItem } from '@/lib/types';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: (available: boolean) => void;
}

export function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-neutral-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <div className="relative h-48 bg-neutral-100">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-neutral-300" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={onEdit}
              className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={onDelete}
              className="bg-white/90 backdrop-blur-sm hover:bg-red-50 hover:text-red-600 shadow-md"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-neutral-900 text-lg">{item.name}</h3>
              <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                {item.description}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-emerald-600">
                ${item.price.toFixed(2)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Available</span>
                <Switch
                  checked={item.available}
                  onCheckedChange={onToggleAvailability}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
