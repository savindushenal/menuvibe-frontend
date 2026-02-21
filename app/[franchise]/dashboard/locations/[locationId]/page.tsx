'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit2, Trash2, Calendar, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import MenuScheduleDialog from './MenuScheduleDialog';

interface MenuWithSchedules {
  id: number;
  name: string;
  slug: string;
  schedules: MenuSchedule[];
}

interface MenuSchedule {
  id: number;
  menu_id: number;
  start_time: string;
  end_time: string;
  days: number[];
  priority: number;
  timezone: string;
  is_active: boolean;
  allow_overlap: boolean;
  start_date?: string;
  end_date?: string;
}

interface Location {
  id: number;
  name: string;
  address: string;
  timezone: string;
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function LocationMenuSchedulesPage() {
  const params = useParams();
  const router = useRouter();
  const franchiseSlug = params?.franchise as string;
  const locationId = params?.locationId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [menus, setMenus] = useState<MenuWithSchedules[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MenuSchedule | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/franchise/${franchiseSlug}/location/${locationId}/menus-schedules`
        );

        if (response.data.success) {
          const data = response.data.data;
          setLocation(data.location);
          setMenus(data.menus || []);
        }
      } catch (err: any) {
        console.error('Failed to fetch menu schedules:', err);
        setError(err.response?.data?.message || 'Failed to load menu schedules');
      } finally {
        setLoading(false);
      }
    };

    if (franchiseSlug && locationId) {
      fetchData();
    }
  }, [franchiseSlug, locationId]);

  const handleSaveSchedule = async (menuId: number, scheduleData: any) => {
    try {
      let response;
      
      if (editingSchedule) {
        // Update existing schedule
        response = await api.put(
          `/franchise/${franchiseSlug}/menus/${menuId}/schedules/${editingSchedule.id}`,
          scheduleData
        );
      } else {
        // Create new schedule
        response = await api.post(
          `/franchise/${franchiseSlug}/menus/${menuId}/schedules`,
          scheduleData
        );
      }

      if (response.data.success) {
        // Refresh the list
        const updatedResponse = await api.get(
          `/franchise/${franchiseSlug}/location/${locationId}/menus-schedules`
        );
        if (updatedResponse.data.success) {
          setMenus(updatedResponse.data.data.menus || []);
          setDialogOpen(false);
          setEditingSchedule(null);
          setSelectedMenu(null);
        }
      }
    } catch (err: any) {
      console.error('Failed to save schedule:', err);
      alert(err.response?.data?.message || 'Failed to save schedule');
    }
  };

  const handleDeleteSchedule = async (menuId: number, scheduleId: number) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const response = await api.delete(
        `/franchise/${franchiseSlug}/menus/${menuId}/schedules/${scheduleId}`
      );

      if (response.data.success) {
        // Refresh the list
        const updatedResponse = await api.get(
          `/franchise/${franchiseSlug}/location/${locationId}/menus-schedules`
        );
        if (updatedResponse.data.success) {
          setMenus(updatedResponse.data.data.menus || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to delete schedule:', err);
      alert(err.response?.data?.message || 'Failed to delete schedule');
    }
  };

  const handleEditSchedule = (schedule: MenuSchedule) => {
    setEditingSchedule(schedule);
    setSelectedMenu(schedule.menu_id);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Menu Schedules</h1>
          {location && (
            <p className="text-neutral-600">{location.name}</p>
          )}
        </div>
      </div>

      {/* Location timezone info */}
      {location && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Timezone:</strong> {location.timezone || 'Not set'}
            </p>
            <p className="text-xs text-blue-700 mt-2">
              All schedule times are evaluated in this timezone.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Menus and their schedules */}
      <div className="space-y-4">
        {menus.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No menus</h3>
              <p className="text-neutral-600">Create menus to set up their schedules</p>
            </CardContent>
          </Card>
        ) : (
          menus.map((menu) => (
            <Card key={menu.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{menu.name}</CardTitle>
                    <CardDescription>Manage time-based availability</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedMenu(menu.id);
                      setEditingSchedule(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {menu.schedules && menu.schedules.length > 0 ? (
                  <div className="space-y-3">
                    {menu.schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-start justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-neutral-500" />
                            <span className="font-medium text-neutral-900">
                              {schedule.start_time} - {schedule.end_time}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600 mb-2">
                            Days: {schedule.days.map(d => dayNames[d]).join(', ')}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                              Priority: {schedule.priority}
                            </span>
                            {schedule.allow_overlap && (
                              <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                                Overlap allowed
                              </span>
                            )}
                            {!schedule.is_active && (
                              <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteSchedule(menu.id, schedule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-600 text-sm">No schedules defined</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Schedule dialog */}
      {selectedMenu && (
        <MenuScheduleDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          menuId={selectedMenu}
          schedule={editingSchedule}
          timezone={location?.timezone}
          onSave={handleSaveSchedule}
        />
      )}
    </div>
  );
}
