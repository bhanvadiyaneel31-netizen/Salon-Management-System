import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Calendar, User, CalendarIcon, CheckCircle2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfDay, isAfter, isBefore } from 'date-fns';
import { appointmentsAPI } from '../../../services/api';
import { getStatusColor } from '../../shared/utils/statusColors';

interface AppointmentsPanelProps {
  setCurrentView: (view: string) => void;
  onReschedule: (appointment: any) => void;
  onReview: (appointment: any) => void;
}

export function AppointmentsPanel({
  setCurrentView,
  onReschedule,
  onReview
}: AppointmentsPanelProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const loadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const data = await appointmentsAPI.getAll();
      const transformed = data.map((apt: any) => ({
        id: String(apt.id),
        service: {
          id: apt.service_id || apt.service?.id,
          name: apt.service?.name || apt.service_name || '',
          price: apt.price || apt.service?.price || 0,
          duration: apt.service?.duration || apt.service_duration || 0
        },
        date: apt.appointment_date,
        time: apt.appointment_time,
        staff: {
          id: apt.staff_id || apt.staff?.id,
          name: apt.staff?.name || apt.staff_name || 'Unassigned',
          speciality: ''
        },
        status: apt.status,

        bookingId: String(apt.id),
        createdAt: apt.created_at,
        notes: apt.notes || '',
        rating: apt.rating,
        review: apt.review
      }));
      setAppointments(transformed);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const cancelAppointment = async (id: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await appointmentsAPI.updateStatus(id, 'cancelled');
        setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, status: 'cancelled' } : apt));
        toast.success("Appointment cancelled successfully");
      } catch (err) {
        console.error('Failed to cancel appointment:', err);
        toast.error("Failed to cancel appointment");
      }
    }
  };

  const upcomingAppointments = appointments.filter(apt => {
    const date = new Date(apt.date);
    const today = new Date();
    return apt.status !== 'cancelled' && apt.status !== 'completed' && (isAfter(date, startOfDay(today)) || format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastAppointments = appointments.filter(apt => {
    const date = new Date(apt.date);
    const today = new Date();
    return apt.status === 'completed' || (isBefore(date, startOfDay(today)) && format(date, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd'));
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">Manage your upcoming and past bookings</p>
        <Button
          variant="outline"
          size="sm"
          className="border-purple-200 text-purple-600 rounded-xl"
          onClick={() => loadAppointments()}
        >
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="bg-purple-50/50 p-1 rounded-2xl border border-purple-100">
          <TabsTrigger value="upcoming" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">Upcoming</TabsTrigger>
          <TabsTrigger value="past" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">Past Visits</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((apt) => (
              <Card key={apt.id} className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden group">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/4 bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white flex flex-col justify-center items-center text-center">
                    <p className="text-sm uppercase tracking-widest opacity-80">{format(new Date(apt.date), 'MMMM')}</p>
                    <p className="text-4xl font-bold">{format(new Date(apt.date), 'dd')}</p>
                    <p className="font-medium mt-1">{apt.time}</p>
                  </div>
                  <CardContent className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <Badge className={`${getStatusColor(apt.status)} border mb-2`}>{apt.status}</Badge>
                        <h3 className="text-xl font-bold text-gray-900">{apt.service.name}</h3>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-500" />
                          Professional: {apt.staff.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="rounded-xl border-purple-200 text-purple-600"
                          onClick={() => onReschedule(apt)}
                        >Reschedule</Button>
                        <Button
                          variant="ghost"
                          className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => cancelAppointment(apt.id)}
                        >Cancel</Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p>No upcoming appointments found.</p>
              <Button
                variant="link"
                className="text-purple-600"
                onClick={() => setCurrentView('booking')}
              >Book one now</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.map((apt) => (
            <Card key={apt.id} className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg group opacity-80 hover:opacity-100 transition-opacity">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{apt.service.name}</h3>
                      <p className="text-xs text-gray-500">{format(new Date(apt.date), 'MMM d, yyyy')} with {apt.staff.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {apt.status === 'completed' && !apt.rating ? (
                      <Button
                        size="sm"
                        className="bg-purple-600 text-white rounded-xl h-8"
                        onClick={() => onReview(apt)}
                      >Leave a Review</Button>
                    ) : apt.rating ? (
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < apt.rating ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    ) : null}
                    <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50 rounded-xl h-8">Rebook</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
