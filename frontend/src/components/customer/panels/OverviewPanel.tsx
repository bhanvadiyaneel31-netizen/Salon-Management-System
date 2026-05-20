import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Calendar, Clock, Star, Scissors, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { getStatusColor } from '../../shared/utils/statusColors';

interface OverviewPanelProps {
  profile: {
    name: string;
    totalAppointments: number;
    loyaltyPoints: number;
  };
  appointments: any[];
  upcomingAppointments: any[];
  setActiveSection: (section: string) => void;
  setCurrentView: (view: string) => void;
  setPreselectedServiceId: (id: string | null) => void;
}

export function OverviewPanel({
  profile,
  appointments,
  upcomingAppointments,
  setActiveSection,
  setCurrentView,
  setPreselectedServiceId
}: OverviewPanelProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl shadow-xl text-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {profile.name.split(' ')[0]}! ✨</h2>
          <p className="text-purple-100 mb-6">
            Ready for your next beauty session? Discover our services or check your upcoming appointments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setActiveSection('services')}
              className="bg-white text-purple-600 hover:bg-gray-50 rounded-xl"
            >
              <Scissors className="w-4 h-4 mr-2" />
              Browse Services
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveSection('appointments')}
              className="border-purple-200 bg-white/10 text-white hover:bg-white/20 rounded-xl"
            >
              <Calendar className="w-4 h-4 mr-2" />
              My Appointments
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Appointments</p>
              <p className="text-3xl font-bold text-gray-900">{profile.totalAppointments}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Loyalty Points</p>
              <p className="text-3xl font-bold text-gray-900">{profile.loyaltyPoints}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
              <Star className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Next Visit</p>
              <p className="text-xl font-bold text-gray-900">
                {upcomingAppointments.length > 0
                  ? format(new Date(`${upcomingAppointments[0].date}T${upcomingAppointments[0].time}`), 'MMM d, h:mm a')
                  : 'No upcoming visits'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.slice(0, 3).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-purple-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Scissors className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{apt.service.name}</p>
                      <p className="text-xs text-gray-500">{format(new Date(apt.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(apt.status)} border text-[10px]`}>
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Latest News/Promos */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Offers for You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-100">
              <h4 className="font-bold text-purple-700">Spring Special 🌸</h4>
              <p className="text-xs text-purple-600 mt-1">Get 20% off on all Hair Spa services this month. Use code SPRING20.</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-100">
              <h4 className="font-bold text-blue-700">Refer a Friend</h4>
              <p className="text-xs text-blue-600 mt-1">Earn 50 loyalty points for every friend you refer!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
