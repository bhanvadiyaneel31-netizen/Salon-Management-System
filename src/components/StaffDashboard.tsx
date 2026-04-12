import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Calendar } from './ui/calendar';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Home,
  Users,
  Search,
  Filter,
  Bell,
  Phone,
  Mail,
  MapPin,
  Star,
  Eye,
  Edit,
  MoreHorizontal,
  LogOut,
  Menu,
  Settings,
  Activity,
  DollarSign,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner';
import { format, addDays, isSameDay } from 'date-fns';
import { getStaffRating } from '../services/appointmentStore';
import { api, appointmentsAPI } from '../services/api';

interface StaffDashboardProps {
  setCurrentView: (view: string) => void;
  setUserRole: (role: string | null) => void;
}

interface Appointment {
  id: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  service: {
    name: string;
    duration: number;
    price: number;
  };
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  preferences?: string;
  isFirstTime?: boolean;
}

interface Notification {
  id: number;
  type: 'new_appointment' | 'reminder' | 'update' | 'cancellation';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function StaffDashboard({ setCurrentView, setUserRole }: StaffDashboardProps) {
  const [activeView, setActiveView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Appointments state - loaded from real backend
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      setLoadingAppointments(true);
      try {
        const data = await appointmentsAPI.getAll();
        // Normalize backend response to match StaffDashboard's Appointment interface
        const normalized: Appointment[] = data.map((apt: any) => ({
          id: apt.id,
          customer: {
            name: apt.customer?.name || 'Unknown Customer',
            email: apt.customer?.email || '',
            phone: apt.customer?.phone || '',
            address: ''
          },
          service: {
            name: apt.service?.name || '',
            duration: apt.service?.duration || 0,
            price: apt.price || 0
          },
          date: apt.appointment_date,
          time: apt.appointment_time,
          status: apt.status === 'in-progress' ? 'in-progress' : apt.status,
          notes: apt.notes || '',
          preferences: '',
          isFirstTime: false
        }));
        setAppointments(normalized);
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setLoadingAppointments(false);
      }
    };
    loadAppointments();
  }, []);

  // Load mock notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: 1,
        type: 'new_appointment',
        title: 'New Appointment Booked',
        message: 'Sarah Johnson booked Hair Cut & Style for tomorrow at 2:00 PM',
        time: '5 minutes ago',
        read: false
      },
      {
        id: 2,
        type: 'reminder',
        title: 'Upcoming Appointment',
        message: 'Emma Wilson - Hair Coloring in 30 minutes',
        time: '30 minutes ago',
        read: false
      },
      {
        id: 3,
        type: 'update',
        title: 'Appointment Updated',
        message: 'Lisa Chen rescheduled wedding styling to 2:30 PM',
        time: '1 hour ago',
        read: true
      }
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const handleLogout = () => {
    setUserRole(null);
    setCurrentView('home');
    toast.success('Logged out successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'in-progress': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in-progress': return <Activity className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: number,
    newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    // Look up the record before the API call to avoid reading stale state afterwards
    const appointment = appointments.find(apt => apt.id === appointmentId);
    try {
      await appointmentsAPI.updateStatus(appointmentId, newStatus);
      setAppointments(prev =>
        prev.map(apt => apt.id === appointmentId ? { ...apt, status: newStatus } : apt)
      );
      toast.success(`${appointment?.customer.name}'s appointment marked as ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update appointment status');
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.customer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = (() => {
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          return isSameDay(appointmentDate, today);
        case 'tomorrow':
          return isSameDay(appointmentDate, addDays(today, 1));
        case 'week':
          const weekFromNow = addDays(today, 7);
          return appointmentDate >= today && appointmentDate <= weekFromNow;
        case 'selected':
          return isSameDay(appointmentDate, selectedDate);
        default:
          return true;
      }
    })();

    const matchesService = serviceFilter === 'all' || appointment.service.name.includes(serviceFilter);
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

    return matchesSearch && matchesDate && matchesService && matchesStatus;
  });

  const todayAppointments = appointments.filter(apt => 
    isSameDay(new Date(apt.date), new Date())
  );

  const upcomingAppointment = todayAppointments
    .filter(apt => apt.status !== 'completed' && apt.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  const completedToday = todayAppointments.filter(apt => apt.status === 'completed').length;
  const totalToday = todayAppointments.length;
  const todayRevenue = todayAppointments
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.service.price, 0);

  const staffRating = getStaffRating('Emma Wilson');

  const renderSidebar = () => (
    <Sidebar className="border-r border-purple-200">
      <SidebarHeader className="border-b border-purple-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Emma Wilson</h3>
            <p className="text-sm text-gray-600">Senior Hair Stylist</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setActiveView('dashboard')}
              className={`w-full justify-start ${activeView === 'dashboard' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-purple-50'}`}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setActiveView('appointments')}
              className={`w-full justify-start ${activeView === 'appointments' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-purple-50'}`}
            >
              <Users className="w-4 h-4" />
              Appointments
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setActiveView('schedule')}
              className={`w-full justify-start ${activeView === 'schedule' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-purple-50'}`}
            >
              <CalendarIcon className="w-4 h-4" />
              Schedule
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setActiveView('notifications')}
              className={`w-full justify-start ${activeView === 'notifications' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-purple-50'}`}
            >
              <Bell className="w-4 h-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-1">
                  {unreadCount}
                </Badge>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-purple-200 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setActiveView('settings')}
              className="w-full justify-start text-gray-600 hover:bg-purple-50"
            >
              <Settings className="w-4 h-4" />
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );

  const renderAppointmentDetails = (appointment: Appointment) => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{appointment.customer.name}</h3>
          <p className="text-gray-600">{appointment.service.name}</p>
        </div>
        <Badge className={`${getStatusColor(appointment.status)} border`}>
          {getStatusIcon(appointment.status)}
          <span className="ml-1 capitalize">{appointment.status}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">Date & Time</Label>
          <p className="text-gray-900">{format(new Date(appointment.date), 'MMMM d, yyyy')} at {appointment.time}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">Duration</Label>
          <p className="text-gray-900">{appointment.service.duration} minutes</p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Contact Information</Label>
        <div className="space-y-2 mt-1">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <a href={`tel:${appointment.customer.phone}`} className="text-purple-600 hover:text-purple-700">
              {appointment.customer.phone}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <a href={`mailto:${appointment.customer.email}`} className="text-purple-600 hover:text-purple-700">
              {appointment.customer.email}
            </a>
          </div>
          {appointment.customer.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <p className="text-gray-600">{appointment.customer.address}</p>
            </div>
          )}
        </div>
      </div>

      {appointment.preferences && (
        <div>
          <Label className="text-sm font-medium text-gray-700">Customer Preferences</Label>
          <p className="text-gray-600 mt-1">{appointment.preferences}</p>
        </div>
      )}

      {appointment.notes && (
        <div>
          <Label className="text-sm font-medium text-gray-700">Service Notes</Label>
          <p className="text-gray-600 mt-1">{appointment.notes}</p>
        </div>
      )}

      {appointment.isFirstTime && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">First-time customer</span>
          </div>
          <p className="text-sm text-amber-700 mt-1">Please ensure extra attention and explanation of services.</p>
        </div>
      )}

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">Update Status</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl"
            onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
            disabled={appointment.status === 'in-progress'}
          >
            <Activity className="w-4 h-4 mr-2" />
            Start Service
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl"
            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
            disabled={appointment.status === 'completed'}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-2">Good morning, Emma!</h2>
          <p className="text-purple-100">
            {totalToday > 0 ? (
              <>You have {totalToday} appointment{totalToday !== 1 ? 's' : ''} scheduled for today. Let's make it a great day!</>
            ) : (
              'No appointments scheduled for today. Enjoy your day off!'
            )}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-semibold text-gray-900">{totalToday}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{completedToday}/{totalToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">${todayRevenue}</p>
              </div>
              <DollarSign className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating ({staffRating.count} reviews)</p>
                <p className="text-2xl font-semibold text-gray-900">{staffRating.average}⭐</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment */}
      {upcomingAppointment && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Next Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 flex-shrink-0 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{upcomingAppointment.customer.name}</h4>
                  <p className="text-gray-600 truncate">{upcomingAppointment.service.name}</p>
                  <p className="text-sm text-gray-500 truncate">{upcomingAppointment.time} • {upcomingAppointment.service.duration} min</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSelectedAppointment(upcomingAppointment);
                  setIsDetailsPanelOpen(true);
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length > 0 ? (
            <div className="space-y-4">
              {todayAppointments.sort((a, b) => a.time.localeCompare(b.time)).map((appointment) => (
                <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center justify-between w-full sm:w-auto">
                    <Badge className={`${getStatusColor(appointment.status)} border`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1 capitalize">{appointment.status}</span>
                    </Badge>
                    <div className="sm:hidden text-right">
                      <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                      <p className="text-xs text-gray-500">{appointment.service.duration} min</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{appointment.customer.name}</p>
                    <p className="text-sm text-gray-600 truncate">{appointment.service.name}</p>
                  </div>
                  <div className="hidden sm:block flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                    <p className="text-xs text-gray-500">{appointment.service.duration} min</p>
                  </div>
                  <div className="flex justify-end sm:block">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:bg-purple-100"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setIsDetailsPanelOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p>No appointments scheduled for today</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Appointments</h2>
          <p className="text-gray-600">Manage your assigned appointments</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by customer name, service, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                />
              </div>
            </div>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                <SelectValue placeholder="Date filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="selected">Selected date</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                <SelectValue placeholder="Service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                <SelectItem value="Hair Cut">Hair Cut</SelectItem>
                <SelectItem value="Hair Coloring">Hair Coloring</SelectItem>
                <SelectItem value="Hair Styling">Hair Styling</SelectItem>
                <SelectItem value="Hair Treatment">Hair Treatment</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateFilter === 'selected' && (
            <div className="mt-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border border-purple-200"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
        <CardContent className="p-0">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{appointment.customer.name}</div>
                        <div className="text-sm text-gray-500">{appointment.customer.phone}</div>
                        {appointment.isFirstTime && (
                          <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 mt-1">
                            First time
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{appointment.service.name}</div>
                        <div className="text-sm text-gray-500">${appointment.service.price}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {format(new Date(appointment.date), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">{appointment.time}</div>
                      </div>
                    </TableCell>
                    <TableCell>{appointment.service.duration} min</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(appointment.status)} border`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1 capitalize">{appointment.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-purple-50"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsDetailsPanelOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="hover:bg-purple-50">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                              disabled={appointment.status === 'in-progress' || appointment.status === 'completed'}
                            >
                              Start Service
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                              disabled={appointment.status === 'completed'}
                            >
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                              disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                              className="text-red-600"
                            >
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-4 md:hidden p-4">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-4 border-purple-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {appointment.customer.name}
                      {appointment.isFirstTime && (
                        <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">New</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{appointment.customer.phone}</div>
                  </div>
                  <Badge className={`${getStatusColor(appointment.status)} border`}>
                    <span className="capitalize">{appointment.status}</span>
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="col-span-2">
                    <span className="text-gray-500 block">Service</span>
                    <span className="font-medium">{appointment.service.name} (${appointment.service.price})</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Date & Time</span>
                    <span className="font-medium">
                      {format(new Date(appointment.date), 'MMM d, yyyy')}<br/>
                      {appointment.time}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Duration</span>
                    <span className="font-medium">{appointment.service.duration} min</span>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end pt-3 border-t border-purple-50">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setIsDetailsPanelOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" /> View
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1 border-purple-200 text-purple-700">
                        Actions <MoreHorizontal className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                        disabled={appointment.status === 'in-progress' || appointment.status === 'completed'}
                      >
                        Start Service
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        disabled={appointment.status === 'completed'}
                      >
                        Mark Complete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                        disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                        className="text-red-600"
                      >
                        Cancel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
          
          {filteredAppointments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg">No appointments found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Schedule</h2>
        <p className="text-gray-600">View your daily schedule and appointments</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border border-purple-200"
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const dayAppointments = appointments.filter(apt => 
                  isSameDay(new Date(apt.date), selectedDate)
                );

                if (dayAppointments.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg">No appointments scheduled</p>
                      <p className="text-sm">Enjoy your day off!</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {dayAppointments
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-colors"
                        >
                          <div className="flex items-center justify-between w-full sm:w-auto sm:block">
                            <div className="flex-shrink-0 text-left sm:text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {appointment.time}
                              </div>
                              <div className="text-xs text-gray-500">
                                {appointment.service.duration}m
                              </div>
                            </div>
                            <div className="sm:hidden flex items-center gap-2">
                              <Badge className={`${getStatusColor(appointment.status)} border`}>
                                {getStatusIcon(appointment.status)}
                                <span className="ml-1 capitalize">{appointment.status}</span>
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {appointment.customer.name}
                              </h4>
                              {appointment.isFirstTime && (
                                <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                                  First time
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {appointment.service.name}
                            </p>
                            {appointment.notes && (
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex justify-between sm:justify-end items-center sm:gap-2">
                            <div className="hidden sm:block">
                              <Badge className={`${getStatusColor(appointment.status)} border`}>
                                {getStatusIcon(appointment.status)}
                                <span className="ml-1 capitalize">{appointment.status}</span>
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-purple-100 w-full sm:w-auto"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setIsDetailsPanelOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2 sm:mr-0" />
                              <span className="sm:hidden">View Details</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Notifications</h2>
        <p className="text-gray-600">Stay updated with your appointments and reminders</p>
      </div>

      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
        <CardContent className="p-0">
          {notifications.length > 0 ? (
            <div className="divide-y divide-purple-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 ${!notification.read ? 'bg-purple-50' : 'bg-white'} hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors first:rounded-t-3xl last:rounded-b-3xl`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.type === 'new_appointment' ? 'bg-green-100 text-green-600' :
                      notification.type === 'reminder' ? 'bg-purple-100 text-purple-600' :
                      notification.type === 'update' ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {notification.type === 'new_appointment' && <Users className="w-4 h-4" />}
                      {notification.type === 'reminder' && <Clock className="w-4 h-4" />}
                      {notification.type === 'update' && <Edit className="w-4 h-4" />}
                      {notification.type === 'cancellation' && <XCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500">{notification.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return renderDashboard();
      case 'appointments': return renderAppointments();
      case 'schedule': return renderSchedule();
      case 'notifications': return renderNotifications();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col lg:flex-row">
          {renderSidebar()}
          
          <main className="flex-1 overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden border-b border-purple-200 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between p-4">
                <SidebarTrigger>
                  <Menu className="w-6 h-6 text-gray-600" />
                </SidebarTrigger>
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="relative hover:bg-purple-50"
                    onClick={() => setActiveView('notifications')}
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full p-0 flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block border-b border-purple-200 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between p-6">
                <div></div>
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="relative hover:bg-purple-50"
                    onClick={() => setActiveView('notifications')}
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full p-0 flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 lg:p-6">
              {renderContent()}
            </div>
          </main>
        </div>
      </SidebarProvider>

      {/* Appointment Details Sheet */}
      <Sheet open={isDetailsPanelOpen} onOpenChange={setIsDetailsPanelOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Appointment Details</SheetTitle>
            <SheetDescription>
              View and manage appointment information
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedAppointment && renderAppointmentDetails(selectedAppointment)}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}