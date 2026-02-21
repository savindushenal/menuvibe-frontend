'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface MenuScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: number;
  schedule?: {
    id: number;
    start_time: string;
    end_time: string;
    days: number[];
    priority: number;
    timezone: string;
    is_active: boolean;
    allow_overlap: boolean;
    start_date?: string;
    end_date?: string;
  } | null;
  timezone?: string;
  onSave: (menuId: number, data: any) => Promise<void>;
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MenuScheduleDialog({
  open,
  onOpenChange,
  menuId,
  schedule,
  timezone = 'UTC',
  onSave,
}: MenuScheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    start_time: '09:00',
    end_time: '17:00',
    days: [0, 1, 2, 3, 4],
    priority: 0,
    is_active: true,
    allow_overlap: false,
    start_date: null as string | null,
    end_date: null as string | null,
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        days: schedule.days,
        priority: schedule.priority,
        is_active: schedule.is_active,
        allow_overlap: schedule.allow_overlap,
        start_date: schedule.start_date || null,
        end_date: schedule.end_date || null,
      });
    } else {
      setFormData({
        start_time: '09:00',
        end_time: '17:00',
        days: [0, 1, 2, 3, 4],
        priority: 0,
        is_active: true,
        allow_overlap: false,
        start_date: null,
        end_date: null,
      });
    }
  }, [schedule, open]);

  const handleDayToggle = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(dayIndex)
        ? prev.days.filter(d => d !== dayIndex)
        : [...prev.days, dayIndex].sort()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.days.length === 0) {
      alert('Please select at least one day');
      return;
    }

    const timeData = {
      start_time: formData.start_time,
      end_time: formData.end_time,
      days: formData.days,
      priority: parseInt(formData.priority.toString()),
      is_active: formData.is_active,
      allow_overlap: formData.allow_overlap,
      timezone: timezone,
    };

    // Add optional date range if provided
    if (formData.start_date) {
      Object.assign(timeData, { start_date: formData.start_date });
    }
    if (formData.end_date) {
      Object.assign(timeData, { end_date: formData.end_date });
    }

    setLoading(true);
    try {
      await onSave(menuId, timeData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {schedule ? 'Edit Menu Schedule' : 'Create Menu Schedule'}
          </DialogTitle>
          <DialogDescription>
            Set when this menu should be available. Times are in {timezone}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Days of week */}
          <div>
            <Label>Days of Week</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {dayNames.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDayToggle(index)}
                  className={`p-2 text-sm font-medium rounded border-2 transition-all ${
                    formData.days.includes(index)
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-600'
                  }`}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="priority">
              Priority
              <span className="text-xs text-neutral-500 ml-2">
                (Higher priority shown first if multiple menus active)
              </span>
            </Label>
            <Input
              id="priority"
              type="number"
              min="0"
              max="100"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
            />
          </div>

          {/* Date range (optional) */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-3">Optional: Seasonal Date Range</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value || null }))}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value || null }))}
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_overlap}
                onChange={(e) => setFormData(prev => ({ ...prev, allow_overlap: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">
                Allow overlap with other menus
                <span className="text-xs text-neutral-500 block">
                  Show corridor if multiple menus active at same time
                </span>
              </span>
            </label>
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
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {schedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
