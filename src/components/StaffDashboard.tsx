import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Search,
  Filter,
  ChevronRight,
  User,
  Settings,
  Bell,
  LogOut,
  Scissors,
  Edit,
  Menu,
  Star,
  Camera,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Briefcase,
  ExternalLink,
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "./ui/dialog";
import { Label } from "./ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger,
  SheetFooter
} from "./ui/sheet";
import { api, staffAPI, appointmentsAPI } from '../services/api';
import { format, isToday, isFuture, isAfter, parseISO, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
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
  appointment_id?: number;
}

interface StaffDashboardProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  setCurrentView: (view: string) => void;
  setUserRole: (role: string | null) => void;
  isDark: boolean;
  toggleDark: () => void;
}

export function StaffDashboard({ 
  activeSection, 
  setActiveSection, 
  setCurrentView, 
  setUserRole, 
  isDark, 
  toggleDark 
}: StaffDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scheduleFilter, setScheduleFilter] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [userData, setUserData] = useState<any>(api.auth.getCurrentUser());
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [staffRating, setStaffRating] = useState({ average: 0, count: 0 });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    profile_image: userData?.profile_image || '',
    password: ''
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const appts = await appointmentsAPI.getAll();
      setAppointments(appts.map((a: any) => ({
        id: a.id,
        customer: {
          name: a.customer?.name || 'Unknown',
          email: a.customer?.email || '',
          phone: a.customer?.phone || '',
          address: a.customer?.address || ''
        },
        service: {
          name: a.service?.name || 'Service',
          duration: a.service?.duration || 0,
          price: a.price || 0
        },
        date: a.appointment_date,
        time: a.appointment_time,
        status: a.status as any,
        notes: a.notes,
        isFirstTime: false
      })));
      
      const ratingData = await staffAPI.getRating(userData.id);
      setStaffRating(ratingData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.id) {
       loadDashboardData();
       const interval = setInterval(loadDashboardData, 60000); // Poll every minute
       return () => clearInterval(interval);
    }
  }, [userData?.id]);

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifications(data.map((n: any) => ({
        id: n.id,
        type: n.type as any,
        title: n.title,
        message: n.message,
        time: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
        read: !!n.is_read,
        appointment_id: n.appointment_id
      })));
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  // Mark all as read when entering notifications section
  useEffect(() => {
    if (activeSection === 'notifications' && unreadCount > 0) {
      const markAll = async () => {
        try {
          await api.notifications.markAllRead();
          setUnreadCount(0);
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
          console.error('Failed to mark all as read:', error);
        }
      };
      markAll();
    }
  }, [activeSection, unreadCount]);

  const markAsRead = async (id: number) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.read) {
      if (notification?.appointment_id) handleNotificationClick(notification);
      return;
    }

    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (notification.appointment_id) {
        handleNotificationClick(notification);
      }
    } catch (err) {
       console.error('Failed to mark as read', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
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
              address: ''
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
            isFirstTime: false
          };
          setAppointments(prev => [...prev, apt!]);
        } catch (error) {
          console.error('Failed to fetch appointment for notification:', error);
          setActiveSection('appointments');
          return;
        }
      }
      
      setSelectedAppointment(apt);
      setIsDetailsPanelOpen(true);
    }
  };

  const updateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const updateData: any = {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        profile_image: profileForm.profile_image
      };
      
      if (profileForm.password) {
        updateData.password = profileForm.password;
      }

      const result = await staffAPI.updateProfile(updateData);
      
      // Sync the returned server data to local state & localStorage
      const updatedUser = {
        ...userData,
        name: result.name || profileForm.name,
        email: result.email || profileForm.email,
        phone: result.phone || profileForm.phone,
        address: result.address || profileForm.address,
        profile_image: result.profile_image || profileForm.profile_image,
        category: result.category || userData?.category
      };
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update form with server-confirmed data
      setProfileForm(prev => ({
        ...prev,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        address: updatedUser.address || '',
        profile_image: updatedUser.profile_image || '',
        password: '' // Clear password field after successful update
      }));
      
      toast.success('Profile updated successfully');
      await loadDashboardData(); // Re-fetch all metrics to ensure UI sync
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const updateAppointmentStatus = async (id: number, status: Appointment['status']) => {
    try {
      await appointmentsAPI.updateStatus(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(prev => prev ? { ...prev, status } : null);
      }
      toast.success(`Appointment marked as ${status}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
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
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in-progress': return <TrendingUp className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const renderDashboard = () => (
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
                    <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
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

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-gray-500">View and manage all your salon sessions</p>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search customers..." 
            className="pl-10 border-purple-200 rounded-xl focus:border-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments
          .filter(a => a.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((appointment) => (
            <Card 
              key={appointment.id} 
              className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
              onClick={() => {
                setSelectedAppointment(appointment);
                setIsDetailsPanelOpen(true);
              }}
            >
              <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{appointment.customer.name}</h3>
                    <p className="text-sm text-gray-500">{appointment.service.name}</p>
                  </div>
                  <Badge className={`${getStatusColor(appointment.status)} border text-[10px]`}>
                    {appointment.status}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-2 text-purple-500" />
                    {format(new Date(appointment.date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-purple-500" />
                    {appointment.time}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">Plan your availability and sessions</p>
        <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-purple-100">
          <Button 
            variant={scheduleFilter === 'today' ? 'default' : 'ghost'} 
            className="rounded-lg px-4 h-9 text-xs"
            onClick={() => setScheduleFilter('today')}
          >Today</Button>
          <Button 
            variant={scheduleFilter === 'upcoming' ? 'default' : 'ghost'} 
            className="rounded-lg px-4 h-9 text-xs"
            onClick={() => setScheduleFilter('upcoming')}
          >Upcoming</Button>
        </div>
      </div>

      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-6">
            {appointments
              .filter(a => {
                const date = new Date(a.date);
                if (scheduleFilter === 'today') return isToday(date);
                if (scheduleFilter === 'upcoming') {
                  const apptDateTime = new Date(`${a.date}T${a.time}`);
                  return isFuture(date) || (isToday(date) && isAfter(apptDateTime, new Date()));
                }
                return true;
              })
              .sort((a, b) => {
                const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
                if (dateDiff !== 0) return dateDiff;
                return a.time.localeCompare(b.time);
              })
              .map((a, idx) => (
                <div key={a.id} className="relative pl-8 pb-6 last:pb-0">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-purple-100" />
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-purple-500 z-10" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-white transition-all border border-transparent hover:border-purple-100 hover:shadow-md">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-purple-600">{a.time}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{format(new Date(a.date), 'MMM d')}</span>
                      </div>
                      <h4 className="font-bold text-gray-900">{a.customer.name}</h4>
                      <p className="text-xs text-gray-600">{a.service.name} • {a.service.duration} mins</p>
                    </div>
                    <div className="flex items-center gap-2">
                       {a.status === 'confirmed' && (
                         <Button 
                           size="sm" 
                           className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 rounded-lg"
                           onClick={(e) => {
                             e.stopPropagation();
                             updateAppointmentStatus(a.id, 'in-progress');
                           }}
                         >Start</Button>
                       )}
                       {a.status === 'in-progress' && (
                         <Button 
                           size="sm" 
                           className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-lg"
                           onClick={(e) => {
                             e.stopPropagation();
                             updateAppointmentStatus(a.id, 'completed');
                           }}
                         >Finish</Button>
                       )}
                       <Badge className={`${getStatusColor(a.status)} border text-[10px]`}>
                         {a.status}
                       </Badge>
                    </div>
                  </div>
                </div>
              ))}
            {appointments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p>No appointments scheduled.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotifications = () => (
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
              <div className={`mt-1 p-2 rounded-xl ${
                n.type === 'new_appointment' ? 'bg-green-100 text-green-600' :
                n.type === 'cancellation' ? 'bg-red-100 text-red-600' :
                'bg-purple-100 text-purple-600'
              }`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-bold ${!n.read ? 'text-purple-900' : 'text-gray-900'}`}>{n.title}</h4>
                  <span className="text-[10px] text-gray-400">{n.time}</span>
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

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <p className="text-gray-500">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
            <p className="text-xs text-gray-500 mt-1">All changes are saved to the database and reflected in real-time across dashboards.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  className="rounded-xl border-purple-200"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="rounded-xl border-purple-200"
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="rounded-xl border-purple-200"
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
                  className="rounded-xl border-purple-200"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="flex items-center gap-2">
                  Primary Service Category
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Admin Controlled</span>
                </Label>
                <Input 
                  value={userData?.category || 'Not Assigned'}
                  disabled
                  className="rounded-xl bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-amber-600 italic px-1">Your service category is set by administration and determines which services you handle.</p>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl h-11"
              onClick={updateProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Profile Preview</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                {profileForm.profile_image ? (
                  <img src={profileForm.profile_image} alt={profileForm.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-purple-300" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-purple-50 text-purple-600 hover:text-purple-700 transition-all">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-bold text-gray-900">{profileForm.name}</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{userData?.role}</p>
            
            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-bold text-purple-600">{staffRating.average}⭐</p>
                <p className="text-[10px] text-gray-400 uppercase">Rating</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{staffRating.count}</p>
                <p className="text-[10px] text-gray-400 uppercase">Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'appointments': return renderAppointments();
      case 'schedule': return renderSchedule();
      case 'notifications': return renderNotifications();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="py-4 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {activeSection === 'dashboard' ? 'Dashboard Overview' :
                 activeSection === 'appointments' ? 'My Appointments' :
                 activeSection === 'schedule' ? 'Work Schedule' :
                 activeSection === 'notifications' ? 'Notifications' :
                 activeSection === 'settings' ? 'Account Settings' :
                 activeSection.replace('-', ' ')}
              </h1>
              <p className="text-gray-500 text-sm">Staff Portal • Welcome back, {userData?.name || 'Staff Member'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100 px-3 py-1">
               {userData?.role === 'staff' ? 'Professional' : 'Staff'}
             </Badge>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          {renderContent()}
        </div>
      </div>

      {/* Appointment Details Sheet */}
      <Sheet open={isDetailsPanelOpen} onOpenChange={setIsDetailsPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 border-0 overflow-y-auto">
          {selectedAppointment && (
            <div className="h-full flex flex-col bg-white">
              <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="flex justify-between items-start mb-4">
                   <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md uppercase text-[10px] px-2">
                     Appointment Info
                   </Badge>
                   <Button variant="ghost" size="icon" onClick={() => setIsDetailsPanelOpen(false)} className="text-white hover:bg-white/10">
                     <XCircle className="w-6 h-6" />
                   </Button>
                </div>
                <h3 className="text-2xl font-bold mb-1">{selectedAppointment.customer.name}</h3>
                <p className="text-purple-100 flex items-center gap-2 text-sm">
                  <Scissors className="w-4 h-4" />
                  {selectedAppointment.service.name}
                </p>
              </div>
              
              <div className="p-6 space-y-8 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400 uppercase tracking-widest">Date</Label>
                    <p className="font-bold flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-purple-500" />
                      {format(new Date(selectedAppointment.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400 uppercase tracking-widest">Time</Label>
                    <p className="font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      {selectedAppointment.time}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                   <Label className="text-xs text-gray-400 uppercase tracking-widest">Status</Label>
                   <div className="flex flex-wrap gap-2">
                     {['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((s) => (
                       <Button
                         key={s}
                         variant={selectedAppointment.status === s ? 'default' : 'outline'}
                         size="sm"
                         className={`rounded-full text-[10px] h-8 px-4 ${selectedAppointment.status === s ? 'shadow-md' : 'border-purple-100'}`}
                         onClick={() => updateAppointmentStatus(selectedAppointment.id, s as any)}
                       >
                         {s.charAt(0).toUpperCase() + s.slice(1)}
                       </Button>
                     ))}
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900">{selectedAppointment.customer.phone}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="font-medium text-gray-900">{selectedAppointment.customer.email}</p>
                      </div>
                   </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <Label className="text-xs text-gray-400 uppercase tracking-widest mb-2 block">Customer Notes</Label>
                    <p className="text-sm text-gray-700 leading-relaxed italic">"{selectedAppointment.notes}"</p>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-100 flex gap-3">
                 <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setIsDetailsPanelOpen(false)}>
                   Close
                 </Button>
                 <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl h-11">
                   Contact
                 </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}