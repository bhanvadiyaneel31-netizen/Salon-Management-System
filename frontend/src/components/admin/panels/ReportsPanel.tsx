import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import {
  BarChart3,
  Users,
  FileText,
  Download,
  Calendar,
  DollarSign,
  Coins,
  XCircle,
  Star
} from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";
import { api, analyticsAPI } from "../../../services/api";

interface ReportsPanelProps {
  staffMembers: any[];
  appointments: any[];
}

export function ReportsPanel({ staffMembers, appointments }: ReportsPanelProps) {
  const [reportType, setReportType] = useState<string>("daily");
  const [selectedReportStaff, setSelectedReportStaff] = useState<string>("all");
  const [reportStartDate, setReportStartDate] = useState<string>("");
  const [reportEndDate, setReportEndDate] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportResult, setReportResult] = useState<any>(null);
  const [lastReportParams, setLastReportParams] = useState<any>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);

  useEffect(() => {
    const loadMonthlyRevenue = async () => {
      try {
        const monthly = await analyticsAPI.getMonthlyRevenue();
        setMonthlyRevenue(monthly || []);
      } catch (err) {
        console.error("Failed to load monthly revenue for reports:", err);
      }
    };
    loadMonthlyRevenue();
  }, []);

  const generateReport = async (type: string) => {
    setIsGeneratingReport(true);
    if (type === 'custom') {
      if (!reportStartDate || !reportEndDate) {
        toast.error('Please select both start and end dates for a custom report');
        setIsGeneratingReport(false);
        return;
      }
      if (new Date(reportStartDate) > new Date(reportEndDate)) {
        toast.error('Start date must be before or equal to end date');
        setIsGeneratingReport(false);
        return;
      }
    }

    try {
      const result = await api.reports.generate({
        reportType: type,
        staffId: selectedReportStaff,
        startDate: reportStartDate,
        endDate: reportEndDate
      });
      setReportResult(result);
      setLastReportParams({
        reportType: type,
        staffId: selectedReportStaff,
        startDate: reportStartDate,
        endDate: reportEndDate
      });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully!`);
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportReport = async (formatType: 'pdf' | 'excel') => {
    if (!reportResult) {
      toast.error('Please generate a report first before exporting.');
      return;
    }

    try {
      toast.loading(`Exporting as ${formatType.toUpperCase()}...`, { id: 'export-toast' });
      const exportParams = lastReportParams || {
        reportType,
        staffId: selectedReportStaff,
        startDate: reportStartDate,
        endDate: reportEndDate
      };

      const blob = await api.reports.export({
        format: formatType,
        ...exportParams
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salon_report_${formatType}_${new Date().toISOString().split('T')[0]}.${formatType === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Report exported successfully!`, { id: 'export-toast' });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export report.', { id: 'export-toast' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending':   return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default:          return 'bg-gray-100 text-gray-700';
    }
  };

  const StaffAvatar = ({ staff, size = 'md' }: { staff: any; size?: 'sm' | 'md' | 'lg' }) => {
    const dims = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm';
    const initials = staff.name.split(' ').map((n: string) => n[0]).join('');
    if (staff.profile_image) {
      return (
        <img
          src={staff.profile_image}
          alt={staff.name}
          className={`${dims} rounded-full object-cover border-2 border-purple-100 shadow-sm`}
        />
      );
    }
    return (
      <div className={`${dims} rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-sm`}>
        {initials}
      </div>
    );
  };

  return (
    <>
      {/* Report Generation */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Generate Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                <BarChart3 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Report</SelectItem>
                <SelectItem value="weekly">Weekly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedReportStaff} onValueChange={setSelectedReportStaff}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                <Users className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Staff Member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffMembers.filter(s => s.status === 'active').map(staff => (
                  <SelectItem key={staff.id} value={staff.id.toString()}>{staff.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {reportType === 'custom' && (
              <>
                <Input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="border-purple-200 focus:border-purple-400 rounded-xl"
                />
                <Input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="border-purple-200 focus:border-purple-400 rounded-xl"
                />
              </>
            )}

            <Button
              onClick={() => generateReport(reportType)}
              disabled={isGeneratingReport}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
            >
              {isGeneratingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportReport('pdf')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReport('excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {reportResult ? reportResult.summary.totalAppointments : '0'}
                </h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-2xl group-hover:bg-purple-200 transition-colors">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Gross Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  ${reportResult ? (reportResult.summary.grossRevenue || 0).toLocaleString() : '0'}
                </h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-2xl group-hover:bg-blue-200 transition-colors">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Discount</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">
                  -${reportResult ? (reportResult.summary.totalDiscount || 0).toLocaleString() : '0'}
                </h3>
              </div>
              <div className="bg-red-100 p-3 rounded-2xl group-hover:bg-red-200 transition-colors">
                <Coins className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Net Revenue</p>
                <h3 className="text-2xl font-bold text-green-600 mt-1">
                  ${reportResult ? reportResult.summary.totalRevenue.toLocaleString() : '0'}
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-2xl group-hover:bg-green-200 transition-colors">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {reportResult ? reportResult.summary.cancelledAppointments : '0'}
                </h3>
              </div>
              <div className="bg-red-100 p-3 rounded-2xl group-hover:bg-red-200 transition-colors">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <Card className="lg:col-span-2 border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Recent Appointments in Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Final</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportResult?.appointments.slice(0, 10).map((apt: any) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">#{apt.id}</TableCell>
                      <TableCell>{apt.customer_name}</TableCell>
                      <TableCell>{apt.service_name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{format(new Date(apt.appointment_date), 'MMM d, yyyy')}</div>
                          <div className="text-sm text-gray-500">{apt.appointment_time}</div>
                        </div>
                      </TableCell>
                      <TableCell>${apt.original_amount}</TableCell>
                      <TableCell className="text-red-500">
                        {apt.discount_amount > 0 ? `-$${apt.discount_amount}` : '-'}
                      </TableCell>
                      <TableCell className="font-bold text-green-600">${apt.final_amount}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(apt.status)}>
                          {apt.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!reportResult && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Generate a report to see data here
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Most Booked Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(reportResult ? reportResult.mostBookedServices : []).map((service: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-700">{service.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{service.count}</div>
                    <div className="text-xs text-gray-500">bookings</div>
                  </div>
                </div>
              ))}
              {(!reportResult || reportResult.mostBookedServices.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No service data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Staff Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Appointments Handled</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Revenue Generated</TableHead>
                  <TableHead>Average Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.filter(s => s.status === 'active' && s.appointments > 0).map((staff) => {
                  const staffAppointments = appointments.filter(a => a.assignedStaff?.id === staff.id);
                  const completedAppointments = staffAppointments.filter(a => a.status === 'completed');
                  const completionRate = staffAppointments.length > 0 ? Math.round((completedAppointments.length / staffAppointments.length) * 100) : 0;
                  const revenue = completedAppointments.reduce((sum, a) => sum + (a.final_amount ?? a.service.price), 0);

                  return (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <StaffAvatar staff={staff} size="sm" />
                          <div>
                            <div className="font-medium">{staff.name}</div>
                            <div className="text-sm text-gray-500">{staff.role}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{staffAppointments.length}</TableCell>
                      <TableCell>
                        <Badge variant={completionRate >= 80 ? "default" : "secondary"} className={completionRate >= 80 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                          {completionRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">${revenue}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{staff.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {staffMembers.filter(s => s.status === 'active' && s.appointments > 0).map((staff) => {
              const staffAppointments = appointments.filter(a => a.assignedStaff?.id === staff.id);
              const completedAppointments = staffAppointments.filter(a => a.status === 'completed');
              const completionRate = staffAppointments.length > 0 ? Math.round((completedAppointments.length / staffAppointments.length) * 100) : 0;
              const revenue = completedAppointments.reduce((sum, a) => sum + (a.final_amount ?? a.service.price), 0);

              return (
                <Card key={staff.id} className="p-4 border-purple-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <StaffAvatar staff={staff} size="md" />
                      <div>
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-500">{staff.role}</div>
                      </div>
                    </div>
                    <Badge variant={completionRate >= 80 ? "default" : "secondary"} className={completionRate >= 80 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                      {completionRate}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 block">Appointments</span>
                      <span className="font-medium">{staffAppointments.length} Handled</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Revenue</span>
                      <span className="font-medium text-green-600">${revenue}</span>
                    </div>
                    <div className="col-span-2 mt-1 pt-2 border-t border-purple-50 flex justify-between items-center">
                      <span className="text-gray-500">Average Rating</span>
                      <span className="font-medium flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {staff.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trends */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} name="Revenue ($)" />
              <Line type="monotone" dataKey="appointments" stroke="#EC4899" strokeWidth={3} name="Appointments" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
