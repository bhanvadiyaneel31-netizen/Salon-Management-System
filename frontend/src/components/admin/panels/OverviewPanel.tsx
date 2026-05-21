import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../ui/sheet';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
  Eye,
  XCircle,
  Clock,
  Mail,
  Phone,
  CalendarIcon,
  AlertCircle,
  Loader2,
  Edit,
  Star
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { analyticsAPI, appointmentsAPI } from '../../../services/api';

interface OverviewPanelProps {
  staffMembers: any[];
}

export function OverviewPanel({ staffMembers }: OverviewPanelProps) {
  const [dashboardStats, setDashboardStats] = useState({ todayAppointments: 0, todayRevenue: 0, activeStaff: 0, growthRate: 0 });
  const [dailyAppointments, setDailyAppointments] = useState([
    { day: 'Mon', appointments: 0, revenue: 0 },
    { day: 'Tue', appointments: 0, revenue: 0 },
    { day: 'Wed', appointments: 0, revenue: 0 },
    { day: 'Thu', appointments: 0, revenue: 0 },
    { day: 'Fri', appointments: 0, revenue: 0 },
    { day: 'Sat', appointments: 0, revenue: 0 },
    { day: 'Sun', appointments: 0, revenue: 0 }
  ]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState([
    { name: 'Hair Services', value: 0, color: '#8B5CF6' },
    { name: 'Facial Treatments', value: 0, color: '#EC4899' },
    { name: 'Nail Care', value: 0, color: '#06B6D4' },
    { name: 'Other', value: 0, color: '#10B981' }
  ]);
  const [mostBookedServices, setMostBookedServices] = useState<any[]>([]);

  // Appointments state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog & Sheet States
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending':   return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default:          return 'bg-gray-100 text-gray-700';
    }
  };

  const getStaffStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const loadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const data = await appointmentsAPI.getAll();
      const normalized = data.map((apt: any) => ({
        id: String(apt.id),
        customer: {
          name: apt.customer?.name || 'Unknown',
          email: apt.customer?.email || '',
          phone: apt.customer?.phone || ''
        },
        service: {
          id: apt.service?.id,
          name: apt.service?.name || '',
          duration: apt.service?.duration || 0,
          price: apt.price || 0
        },
        assignedStaff: apt.staff ? { id: apt.staff.id, name: apt.staff.name } : null,
        date: apt.appointment_date,
        time: apt.appointment_time,
        status: apt.status,
        notes: apt.notes || '',
        createdAt: apt.created_at,
        bookedBy: 'customer',
        original_amount: apt.original_amount ?? apt.price ?? 0,
        discount_amount: apt.discount_amount ?? 0,
        final_amount: apt.final_amount ?? ((apt.price ?? 0) - (apt.discount_amount ?? 0)) ?? 0,
        discount_type: apt.discount_type,
        points_redeemed: apt.points_redeemed
      }));
      setAppointments(normalized);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 60000);
    return () => clearInterval(interval);
  }, []);

  const recentAppointments = appointments.slice(0, 4).map(apt => ({
    id: apt.id,
    customer: apt.customer.name,
    service: apt.service.name,
    staff: apt.assignedStaff?.name || 'Unassigned',
    time: apt.time,
    status: apt.status
  }));

  const loadAnalytics = async () => {
    try {
      const results = await Promise.allSettled([
        analyticsAPI.getWeeklyData(),
        analyticsAPI.getServiceDistribution(),
        analyticsAPI.getDashboardStats(),
        analyticsAPI.getServicePerformance(),
        analyticsAPI.getMonthlyRevenue()
      ]);

      const getValue = (index: number, defaultValue: any) => {
        const res = results[index];
        if (res.status === 'fulfilled') return res.value;
        console.error(`Analytics endpoint ${index} failed:`, (res as PromiseRejectedResult).reason);
        return defaultValue;
      };

      const weekly = getValue(0, []);
      const distribution = getValue(1, []);
      const stats = getValue(2, { todayAppointments: 0, todayRevenue: 0, activeStaff: 0, growthRate: 0 });
      const servicePerf = getValue(3, []);
      const monthly = getValue(4, []);

      setDailyAppointments((weekly || []).map((d: any) => ({ day: d.day, appointments: d.appointments, revenue: d.revenue })));
      setServiceDistribution(distribution);
      setDashboardStats(stats);
      setMonthlyRevenue(monthly);

      const mappedServices = (servicePerf || []).map((s: any) => ({
        id: s.service_id.toString(),
        service: s.service_name,
        bookings: s.total_bookings,
        revenue: s.total_revenue
      })).slice(0, 5);
      setMostBookedServices(mappedServices);
    } catch (err) {
      console.error('Critical failure in loadAnalytics:', err);
    }
  };

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(() => {
      loadAnalytics();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await appointmentsAPI.updateStatusAdmin(appointmentId, newStatus);
      toast.success(`Appointment ${appointmentId} status updated to ${newStatus}`);
      await loadAppointments();
      await loadAnalytics();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const rescheduleAppointment = async (appointmentId: string, newDate: string, newTime: string) => {
    try {
      await appointmentsAPI.rescheduleAdmin(appointmentId, {
        appointment_date: newDate,
        appointment_time: newTime
      });
      toast.success(`Appointment ${appointmentId} rescheduled`);
      setIsEditAppointmentOpen(false);
      await loadAppointments();
      await loadAnalytics();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reschedule');
    }
  };

  const cancelAppointment = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'cancelled');
  };

  const handleViewAppointmentDetails = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      setSelectedAppointment(apt);
      setIsAppointmentDetailsOpen(true);
    }
  };

  const handleEditAppointment = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      setSelectedAppointment(apt);
      setIsEditAppointmentOpen(true);
    }
  };

  const handleViewDetails = (staff: any) => {
    setSelectedStaff(staff);
    setIsDetailsOpen(true);
  };

  const StaffAvatar = ({ staff, size = 'md' }: { staff: any; size?: 'sm' | 'md' | 'lg' }) => {
    const dims = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm';
    const initials = staff.name.split(' ').map((n: string) => n[0]).join('');
    if (staff.profile_image) {
      return (
        <img
          src={staff.profile_image}
          alt={staff.name}
          className={`${dims} rounded-full object-cover flex-shrink-0 border-2 border-purple-100`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            (e.currentTarget.nextSibling as HTMLElement | null)?.style?.removeProperty('display');
          }}
        />
      );
    }
    return (
      <div className={`${dims} bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0`}>
        <span className="text-white font-bold">{initials}</span>
      </div>
    );
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Today's Appointments</p>
                <p className="text-3xl font-bold">{dashboardStats.todayAppointments}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Today's Revenue</p>
                <p className="text-3xl font-bold">${dashboardStats.todayRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Active Staff</p>
                <p className="text-3xl font-bold">{dashboardStats.activeStaff}</p>
              </div>
              <Users className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100">Growth Rate</p>
                <p className="text-3xl font-bold">+{dashboardStats.growthRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-pink-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyAppointments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointments" fill="#8B5CF6" name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Service Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceDistribution}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ name, value, percent }) => {
                    if (value === 0 || percent < 0.05) return null;
                    return `${name}: ${value}`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceDistribution.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-gray-700 text-sm">
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.customer}</TableCell>
                    <TableCell>{appointment.service}</TableCell>
                    <TableCell>{appointment.staff}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleViewAppointmentDetails(appointment.id)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleEditAppointment(appointment.id)}>
                            <Calendar className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onSelect={() => cancelAppointment(appointment.id)}>
                            <XCircle className="w-4 h-4 mr-2" /> Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {recentAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-4 border-purple-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-gray-900">{appointment.customer}</div>
                    <div className="text-sm text-gray-500">{appointment.service}</div>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    {appointment.staff}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    {appointment.time}
                  </div>
                </div>
                <div className="flex justify-end border-t border-purple-50 pt-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 border-purple-200">
                        Actions <MoreHorizontal className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleViewAppointmentDetails(appointment.id)}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleEditAppointment(appointment.id)}>
                        <Calendar className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onSelect={() => cancelAppointment(appointment.id)}>
                        <XCircle className="w-4 h-4 mr-2" /> Cancel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Performance Overview */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">Staff Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {staffMembers.slice(0, 4).map((staff) => (
              <div key={staff.id} className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{staff.name}</h3>
                    <p className="text-gray-600">{staff.role}</p>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    ⭐ {staff.rating.toFixed(1)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">This week: {staff.appointments} appointments</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 hover:bg-purple-100"
                    onClick={() => handleViewDetails(staff)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold text-gray-900">Staff Details</SheetTitle>
              <SheetDescription className="text-sm text-gray-500">
                Complete profile and performance information
              </SheetDescription>
            </SheetHeader>
          </div>

          {selectedStaff && (
            <div className="px-6 py-6 space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 text-center border border-purple-100">
                <div className="flex justify-center mb-4">
                  <StaffAvatar staff={selectedStaff} size="lg" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedStaff.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{selectedStaff.role}</p>
                <Badge className={getStaffStatusColor(selectedStaff.status)} variant="secondary">
                  {selectedStaff.status.charAt(0).toUpperCase() + selectedStaff.status.slice(1)}
                </Badge>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Email</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{selectedStaff.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-pink-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                      <p className="text-sm font-medium text-gray-800">{selectedStaff.phone || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{selectedStaff.appointments}</div>
                    <div className="text-xs font-medium text-purple-500">Total Completed</div>
                  </div>
                  <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-pink-600 mb-1">{selectedStaff.rating.toFixed(1)}</div>
                    <div className="text-xs font-medium text-pink-500">Avg Rating</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Additional Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Specialty</span>
                    <span className="text-sm font-semibold text-gray-800">{selectedStaff.specialty || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">Join Date</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedStaff.joinDate ? new Date(selectedStaff.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Appointment Details Dialog */}
      <Dialog open={isAppointmentDetailsOpen} onOpenChange={setIsAppointmentDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              Complete information about this appointment
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Booking ID</Label>
                  <p className="text-gray-900 font-mono">{selectedAppointment.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Customer Information</Label>
                <div className="mt-2 space-y-2">
                  <p className="font-medium">{selectedAppointment.customer.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {selectedAppointment.customer.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {selectedAppointment.customer.phone}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Service</Label>
                  <p className="text-gray-900">{selectedAppointment.service.name}</p>
                  <p className="text-sm text-gray-600">${selectedAppointment.service.price} • {selectedAppointment.service.duration} min</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Assigned Staff</Label>
                  {selectedAppointment.assignedStaff ? (
                    <p className="text-gray-900">{selectedAppointment.assignedStaff.name}</p>
                  ) : (
                    <Badge variant="outline" className="border-red-200 text-red-700">
                      Unassigned
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Date</Label>
                  <p className="text-gray-900">{format(new Date(selectedAppointment.date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Time</Label>
                  <p className="text-gray-900">{selectedAppointment.time}</p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Notes</Label>
                  <p className="text-gray-600 mt-1">{selectedAppointment.notes}</p>
                </div>
              )}

              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <Label className="text-sm font-bold text-purple-900 mb-2 block">Financial Summary</Label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Original Price:</span>
                    <span className="font-medium">${Number(selectedAppointment.original_amount).toFixed(2)}</span>
                  </div>
                  {selectedAppointment.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Loyalty Discount ({selectedAppointment.discount_type || 'loyalty'}):</span>
                      <span>-${Number(selectedAppointment.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-purple-100">
                    <span className="text-purple-900">Final Payable:</span>
                    <span className="text-purple-600">${Number(selectedAppointment.final_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Booked Via</Label>
                  <p className="text-gray-600">{selectedAppointment.bookedBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created</Label>
                  <p className="text-gray-600">{format(new Date(selectedAppointment.createdAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAppointmentDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Reschedule Appointment Dialog */}
      <Dialog open={isEditAppointmentOpen} onOpenChange={setIsEditAppointmentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Update the date and time for this appointment
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="font-medium">{selectedAppointment.customer.name}</p>
                <p className="text-sm text-gray-600">{selectedAppointment.service.name}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>New Date</Label>
                  <Input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="border-purple-200 focus:border-purple-400 rounded-xl"
                  />
                </div>
                <div>
                  <Label>New Time</Label>
                  <Input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="border-purple-200 focus:border-purple-400 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditAppointmentOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (rescheduleDate && rescheduleTime) {
                  rescheduleAppointment(selectedAppointment?.id, rescheduleDate, rescheduleTime);
                } else {
                  toast.error('Please select both date and time');
                }
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Separate component wrapper for DropdownMenu items as needed to avoid name collision with standard tags
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../ui/dropdown-menu';
