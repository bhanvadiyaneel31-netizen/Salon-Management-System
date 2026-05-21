import { Card, CardContent } from '../../ui/card';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../shared/hooks/useNotifications';
import { api, appointmentsAPI } from '../../../services/api';

interface StaffNotificationsPanelProps {
  activeSection: string;
  appointments: any[];
  onAppointmentSelect: (apt: any) => void;
  setAppointments: (updater: (prev: any[]) => any[]) => void;
  setActiveSection: (section: string) => void;
}

export function StaffNotificationsPanel({
  activeSection,
  appointments,
  onAppointmentSelect,
  setAppointments,
  setActiveSection
}: StaffNotificationsPanelProps) {
  const { notifications, markAsRead: markAsReadHook } = useNotifications(activeSection);

  const handleNotificationClick = async (notification: any) => {
    if (notification.appointment_id) {
      let apt = appointments.find(a => a.id === notification.appointment_id);

      if (!apt) {
        try {
          const data = await appointmentsAPI.getById(notification.appointment_id);
          apt = {
            id: data.id,
            customer: {
              name: data.customer?.name || 'Unknown',
              email: data.customer?.email || '',
              phone: data.customer?.phone || '',
              address: '',
              loyalty_points: data.customer?.loyalty_points || 0
            },
            service: {
              name: data.service?.name || '',
              duration: data.service?.duration || 0,
              price: data.price || 0
            },
            date: data.appointment_date,
            time: data.appointment_time,
            status: data.status as any,
            notes: data.notes || '',
            preferences: '',
            isFirstTime: false,
            price: data.price || 0,
            original_amount: data.original_amount || data.price || 0,
            discount_amount: data.discount_amount || 0,
            final_amount: data.final_amount || data.price || 0,
            points_redeemed: data.points_redeemed || 0
          };
          setAppointments(prev => [...prev, apt!]);
        } catch (error) {
          console.error('Failed to fetch appointment for notification:', error);
          setActiveSection('appointments');
          return;
        }
      }

      onAppointmentSelect(apt);
    }
  };

  const markAsRead = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.read) {
      if (notification?.appointment_id) handleNotificationClick(notification);
      return;
    }

    try {
      await api.notifications.markAsRead(id);
      // Wait for hook to update or call local markAsReadHook
      await markAsReadHook(id);

      if (notification.appointment_id) {
        handleNotificationClick(notification);
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-500">Keep track of your latest updates and requests</p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`border-0 rounded-2xl shadow-sm cursor-pointer transition-all hover:shadow-md ${!n.read ? 'bg-purple-50/50 border-l-4 border-l-purple-500' : 'bg-white'}`}
            onClick={() => markAsRead(n.id)}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div className={`mt-1 p-2 rounded-xl ${n.type === 'new_appointment' ? 'bg-green-100 text-green-600' :
                n.type === 'cancellation' ? 'bg-red-100 text-red-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-bold ${!n.read ? 'text-purple-900' : 'text-gray-900'}`}>{n.title}</h4>
                  <span className="text-[10px] text-gray-400">{n.time || n.timestamp}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
              </div>
              {!n.read && <div className="mt-2 w-2 h-2 bg-purple-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p>No new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
