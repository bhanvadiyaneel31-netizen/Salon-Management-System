import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  UserCog,
  Search,
  CalendarIcon,
  Users,
  Scissors,
  Filter,
  Coins,
  MoreHorizontal,
  Eye,
  Edit,
  XCircle,
  Zap,
  Star,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { appointmentsAPI } from '../../../services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../ui/dropdown-menu';

interface AppointmentsPanelProps {
  appointments: any[];
  staffMembers: any[];
  services: any[];
  onAppointmentsChange: () => void;
}

export function AppointmentsPanel({ appointments, staffMembers, services, onAppointmentsChange }: AppointmentsPanelProps) {
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [appointmentDateFilter, setAppointmentDateFilter] = useState('all');
  const [appointmentStaffFilter, setAppointmentStaffFilter] = useState('all');
  const [appointmentServiceFilter, setAppointmentServiceFilter] = useState('all');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');
  const [appointmentDiscountFilter, setAppointmentDiscountFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [appointmentHistoryTab, setAppointmentHistoryTab] = useState('upcoming');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending':   return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default:          return 'bg-gray-100 text-gray-700';
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await appointmentsAPI.updateStatusAdmin(appointmentId, newStatus);
      toast.success(`Appointment ${appointmentId} status updated to ${newStatus}`);
      onAppointmentsChange();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const assignStaffToAppointment = async (appointmentId: string, staffId: string) => {
    try {
      await appointmentsAPI.rescheduleAdmin(appointmentId, { staff_id: staffId });
      const staff = staffMembers.find(s => s.id === staffId);
      toast.success(`${staff?.name} assigned to appointment ${appointmentId}`);
      setIsAssignStaffOpen(false);
      onAppointmentsChange();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign staff');
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
      onAppointmentsChange();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reschedule');
    }
  };

  const cancelAppointment = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'cancelled');
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

  // Filter appointments based on search and filters
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch =
      appointment.customer.name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
      appointment.id.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
      appointment.customer.email.toLowerCase().includes(appointmentSearchTerm.toLowerCase());

    const matchesDate = (() => {
      if (appointmentDateFilter === 'all') return true;
      const appointmentDate = new Date(appointment.date);
      const today = new Date();

      switch (appointmentDateFilter) {
        case 'today':
          return format(appointmentDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        case 'tomorrow':
          return format(appointmentDate, 'yyyy-MM-dd') === format(addDays(today, 1), 'yyyy-MM-dd');
        case 'week':
          const weekStart = startOfWeek(today);
          const weekEnd = endOfWeek(today);
          return appointmentDate >= weekStart && appointmentDate <= weekEnd;
        case 'month':
          const monthStart = startOfMonth(today);
          const monthEnd = endOfMonth(today);
          return appointmentDate >= monthStart && appointmentDate <= monthEnd;
        default:
          return true;
      }
    })();

    const matchesStaff = appointmentStaffFilter === 'all' ||
      (appointment.assignedStaff && appointment.assignedStaff.id.toString() === appointmentStaffFilter) ||
      (appointmentStaffFilter === 'unassigned' && !appointment.assignedStaff);

    const matchesService = appointmentServiceFilter === 'all' ||
      (appointment.service.id && appointment.service.id.toString() === appointmentServiceFilter);

    const matchesStatus = appointmentStatusFilter === 'all' ||
      appointment.status === appointmentStatusFilter;

    const matchesDiscount = (() => {
      if (appointmentDiscountFilter === 'all') return true;
      const hasDiscount = (appointment.discount_amount || 0) > 0;
      switch (appointmentDiscountFilter) {
        case 'discounted': return hasDiscount;
        case 'none': return !hasDiscount;
        case 'loyalty': return appointment.discount_type === 'loyalty' || (appointment.points_redeemed || 0) > 0;
        default: return true;
      }
    })();

    return matchesSearch && matchesDate && matchesStaff && matchesService && matchesStatus && matchesDiscount;
  });

  const upcomingAppointments = filteredAppointments.filter(apt =>
    apt.status === 'pending' || apt.status === 'confirmed'
  );

  const completedAppointments = filteredAppointments.filter(apt =>
    apt.status === 'completed'
  );

  const cancelledAppointments = filteredAppointments.filter(apt =>
    apt.status === 'cancelled'
  );

  return (
    <>
      {/* Appointment Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Appointments</p>
                <p className="text-3xl font-bold">{appointments.length}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Confirmed</p>
                <p className="text-3xl font-bold">{appointments.filter(a => a.status === 'confirmed').length}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Pending</p>
                <p className="text-3xl font-bold">{appointments.filter(a => a.status === 'pending').length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Unassigned</p>
                <p className="text-3xl font-bold">{appointments.filter(a => !a.assignedStaff).length}</p>
              </div>
              <UserCog className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by customer name, booking ID, or email..."
                  value={appointmentSearchTerm}
                  onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                />
              </div>
            </div>

            <Select value={appointmentDateFilter} onValueChange={setAppointmentDateFilter}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={appointmentStaffFilter} onValueChange={setAppointmentStaffFilter}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                <Users className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staffMembers.filter(s => s.status === 'active').map(staff => (
                  <SelectItem key={staff.id} value={staff.id.toString()}>{staff.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={appointmentServiceFilter} onValueChange={setAppointmentServiceFilter}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                <Scissors className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id.toString()}>{service.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={appointmentStatusFilter} onValueChange={setAppointmentStatusFilter}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={appointmentDiscountFilter} onValueChange={setAppointmentDiscountFilter}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                <Coins className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Discount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="discounted">Discounted Only</SelectItem>
                <SelectItem value="none">No Discount</SelectItem>
                <SelectItem value="loyalty">Loyalty Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointment History Tabs */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Appointment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={appointmentHistoryTab} onValueChange={setAppointmentHistoryTab}>
            <TabsList className="flex flex-col sm:grid sm:grid-cols-3 w-full h-auto gap-1 bg-purple-50 p-1 rounded-xl">
              <TabsTrigger value="upcoming" className="w-full">Upcoming ({upcomingAppointments.length})</TabsTrigger>
              <TabsTrigger value="completed" className="w-full">Completed ({completedAppointments.length})</TabsTrigger>
              <TabsTrigger value="cancelled" className="w-full">Cancelled ({cancelledAppointments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Assigned Staff</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{appointment.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{appointment.customer.name}</div>
                            <div className="text-sm text-gray-500">{appointment.customer.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{appointment.service.name}</div>
                            <div className="text-sm text-gray-500">${appointment.service.price} • {appointment.service.duration}min</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')}</div>
                            <div className="text-sm text-gray-500">{appointment.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {appointment.assignedStaff ? (
                            <Badge variant="outline" className="border-green-200 text-green-700">
                              {appointment.assignedStaff.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-200 text-red-700">
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => {
                                setSelectedAppointment(appointment);
                                setIsAppointmentDetailsOpen(true);
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {!appointment.assignedStaff && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setIsAssignStaffOpen(true);
                                }}>
                                  <UserCog className="w-4 h-4 mr-2" />
                                  Assign Staff
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {
                                setSelectedAppointment(appointment);
                                setRescheduleDate(appointment.date);
                                setRescheduleTime(appointment.time);
                                setIsEditAppointmentOpen(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Reschedule
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                disabled={appointment.status === 'confirmed'}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Confirm
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                disabled={appointment.status === 'completed'}
                              >
                                <Zap className="w-4 h-4 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => cancelAppointment(appointment.id)}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="p-4 border-purple-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-gray-900">{appointment.customer.name}</div>
                        <div className="text-sm text-gray-500">{appointment.id}</div>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="col-span-2">
                        <span className="text-gray-500 block">Service</span>
                        <span className="font-medium">{appointment.service.name} (${appointment.service.price})</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Date & Time</span>
                        <span className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')} • {appointment.time}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Staff</span>
                        {appointment.assignedStaff ? (
                          <span className="font-medium text-green-600">{appointment.assignedStaff.name}</span>
                        ) : (
                          <span className="font-medium text-red-600">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-3 border-t border-purple-50">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full border-purple-200 text-purple-600">
                            Manage Booking <MoreHorizontal className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsAppointmentDetailsOpen(true);
                          }}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {!appointment.assignedStaff && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsAssignStaffOpen(true);
                            }}>
                              <UserCog className="w-4 h-4 mr-2" /> Assign Staff
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsEditAppointmentOpen(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" /> Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            disabled={appointment.status === 'confirmed'}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            disabled={appointment.status === 'completed'}
                          >
                            <Zap className="w-4 h-4 mr-2" /> Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => cancelAppointment(appointment.id)}
                            className="text-red-600"
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>

              {upcomingAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No upcoming appointments found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Original</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Final Revenue</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{appointment.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{appointment.customer.name}</div>
                            <div className="text-sm text-gray-500">{appointment.customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{appointment.service.name}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')}</div>
                            <div className="text-sm text-gray-500">{appointment.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>{appointment.assignedStaff?.name}</TableCell>
                        <TableCell>
                          <span className="text-gray-500">${Number(appointment.original_amount).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-red-500">
                            {appointment.discount_amount > 0 ? `-$${Number(appointment.discount_amount).toFixed(2)}` : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-green-600">${Number(appointment.final_amount).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsAppointmentDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
                {completedAppointments.map((appointment) => (
                  <Card key={appointment.id} className="p-4 border-purple-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-gray-900">{appointment.customer.name}</div>
                        <div className="text-sm text-gray-500">{appointment.id}</div>
                      </div>
                      <span className="font-bold text-green-600">${Number(appointment.final_amount).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="col-span-2">
                        <span className="text-gray-500 block">Service</span>
                        <span className="font-medium">{appointment.service.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Date & Time</span>
                        <span className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')} <br /> {appointment.time}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Staff</span>
                        <span className="font-medium">{appointment.assignedStaff?.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-end pt-3 border-t border-purple-50">
                      <Button variant="outline" size="sm" className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={() => {
                        setSelectedAppointment(appointment);
                        setIsAppointmentDetailsOpen(true);
                      }}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {completedAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No completed appointments found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Original Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cancelledAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{appointment.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{appointment.customer.name}</div>
                            <div className="text-sm text-gray-500">{appointment.customer.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{appointment.service.name}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')}</div>
                            <div className="text-sm text-gray-500">{appointment.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{appointment.notes || 'No reason provided'}</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsAppointmentDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
                {cancelledAppointments.map((appointment) => (
                  <Card key={appointment.id} className="p-4 border-red-100 bg-red-50/30">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-gray-900">{appointment.customer.name}</div>
                        <div className="text-sm text-gray-500">{appointment.id}</div>
                      </div>
                      <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="col-span-2">
                        <span className="text-gray-500 block">Service</span>
                        <span className="font-medium">{appointment.service.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Date & Time</span>
                        <span className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')} <br /> {appointment.time}</span>
                      </div>
                      <div className="col-span-2 mt-2">
                        <span className="text-gray-500 block">Reason</span>
                        <span className="font-medium text-gray-700">{appointment.notes || 'No reason provided'}</span>
                      </div>
                    </div>
                    <div className="flex justify-end pt-3 border-t border-red-100">
                      <Button variant="outline" size="sm" className="w-full text-gray-700 hover:bg-gray-100" onClick={() => {
                        setSelectedAppointment(appointment);
                        setIsAppointmentDetailsOpen(true);
                      }}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {cancelledAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No cancelled appointments found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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

      {/* Assign Staff Dialog */}
      <Dialog open={isAssignStaffOpen} onOpenChange={setIsAssignStaffOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Staff Member</DialogTitle>
            <DialogDescription>
              Select a staff member to assign to this appointment
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="font-medium">{selectedAppointment.customer.name}</p>
                <p className="text-sm text-gray-600">{selectedAppointment.service.name}</p>
                <p className="text-sm text-gray-600">{format(new Date(selectedAppointment.date), 'MMM d, yyyy')} at {selectedAppointment.time}</p>
              </div>

              <div className="space-y-3">
                <Label>Available Staff Members</Label>
                <div className="space-y-2">
                  {(() => {
                    const eligibleStaff = staffMembers.filter(s =>
                      s.status === 'active' &&
                      (!selectedAppointment.service.id || (s.assigned_service_ids && s.assigned_service_ids.includes(selectedAppointment.service.id)))
                    );

                    if (eligibleStaff.length === 0) {
                      return (
                        <div className="p-4 border border-dashed border-amber-200 bg-amber-50 rounded-lg text-center">
                          <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                          <p className="text-sm text-amber-700 font-medium">No specialized staff assigned to this service</p>
                          <p className="text-xs text-amber-600 mt-1">Please assign a staff member to this service in Staff Management first.</p>
                        </div>
                      );
                    }

                    return eligibleStaff.map(staff => (
                      <Button
                        key={staff.id}
                        variant="outline"
                        className="w-full justify-start h-auto py-3 border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-all"
                        onClick={() => assignStaffToAppointment(selectedAppointment.id, staff.id)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <StaffAvatar staff={staff} size="md" />
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{staff.name}</div>
                            <div className="text-xs text-gray-500 truncate">{staff.role}</div>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs font-bold">{staff.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </Button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignStaffOpen(false)}>
              Cancel
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
