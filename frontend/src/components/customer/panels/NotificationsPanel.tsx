import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../shared/hooks/useNotifications';

interface NotificationsPanelProps {
  activeSection: string;
}

export function NotificationsPanel({
  activeSection
}: NotificationsPanelProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications(activeSection);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">Stay updated on your salon activity</p>
        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-purple-600 hover:bg-purple-50 rounded-xl h-8">
          Mark all as read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`border-0 rounded-2xl shadow-sm transition-all hover:shadow-md cursor-pointer ${!n.read ? 'bg-purple-50/50 border-l-4 border-l-purple-500' : 'bg-white'}`}
            onClick={() => markAsRead(n.id)}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div className={`p-2 rounded-xl shrink-0 ${!n.read ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-bold ${!n.read ? 'text-purple-900' : 'text-gray-900'}`}>{n.title}</h4>
                  <span className="text-[10px] text-gray-400">{n.timestamp}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
              </div>
              {!n.read && <div className="mt-2 w-2 h-2 bg-purple-500 rounded-full shrink-0" />}
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
