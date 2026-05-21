import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Star, Bell, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { isToday } from 'date-fns';
import { getStatusColor } from '../../shared/utils/statusColors';

interface OverviewPanelProps {
  appointments: any[];
  staffRating: { average: number; count: number };
  notifications: any[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed': return <CheckCircle2 className="w-4 h-4" />;
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'in-progress': return <TrendingUp className="w-4 h-4" />;
    case 'completed': return <CheckCircle2 className="w-4 h-4" />;
    case 'cancelled': return <XCircle className="w-4 h-4" />;
    default: return <AlertCircle className="w-4 h-4" />;
  }
};

export function OverviewPanel({ appointments, staffRating, notifications }: OverviewPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
            <CalendarIcon className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {appointments.filter(a => isToday(new Date(a.date))).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Ready for your day?</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
            <Clock className="w-4 h-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {appointments.filter(a => a.status === 'pending').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Need your attention</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
            <Star className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{staffRating.average} ⭐</div>
            <p className="text-xs text-gray-500 mt-1">From {staffRating.count} reviews</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Services</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {appointments.filter(a => a.status === 'completed').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments
                .filter(a => isToday(new Date(a.date)))
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-purple-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs font-bold text-purple-600">{appointment.time}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{appointment.customer.name}</p>
                        <p className="text-xs text-gray-500">{appointment.service.name}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(appointment.status)} border text-[10px]`}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
              {appointments.filter(a => isToday(new Date(a.date))).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No appointments scheduled for today.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-purple-50 transition-colors">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-purple-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{n.time || n.timestamp}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>All clear! No notifications.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
