import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import {
  Users,
  Calendar,
  Clock,
  Mail,
  Phone,
  Plus,
  Star,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Award,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { staffAPI } from '../../../services/api';

interface StaffPanelProps {
  staffMembers: any[];
  services: any[];
  onStaffChange: () => void;
  setActiveSection: (section: string) => void;
}

export function StaffPanel({ staffMembers, services, onStaffChange, setActiveSection }: StaffPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states for add/edit staff
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    category: 'Hair',
    status: 'active' as const,
    specialty: '',
    role: 'staff'
  });
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  const getStaffStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || staff.category === filterRole;
    const matchesStatus = filterStatus === 'all' || staff.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const resetForm = () => {
    setStaffForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      category: 'Hair',
      status: 'active',
      specialty: '',
      role: 'staff'
    });
    setSelectedServiceIds([]);
  };

  const handleAddStaff = async () => {
    if (!staffForm.name || !staffForm.email || !staffForm.password || !staffForm.category) {
      toast.error('Please fill in name, email, password, and category');
      return;
    }
    try {
      await staffAPI.create({
        name: staffForm.name,
        email: staffForm.email,
        password: staffForm.password,
        category: staffForm.category,
        status: staffForm.status || 'active',
        service_ids: selectedServiceIds
      } as any);
      toast.success(`${staffForm.name} has been added to the team!`);
      resetForm();
      setIsAddStaffOpen(false);
      onStaffChange();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add staff member');
    }
  };

  const handleEditStaff = async () => {
    if (!editingStaff || !staffForm.category) {
      toast.error('Primary category is required');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      await staffAPI.update(editingStaff.id, {
        category: staffForm.category,
        status: staffForm.status,
        role: staffForm.role,
        service_ids: selectedServiceIds
      });

      toast.success('Staff details updated successfully!');
      resetForm();
      setEditingStaff(null);
      setIsEditStaffOpen(false);
      onStaffChange();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update staff member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    const staff = staffMembers.find(s => s.id === staffId);
    try {
      await staffAPI.delete(staffId);
      toast.success(`${staff?.name} has been permanently removed from the team`);
      onStaffChange();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete staff member');
    }
  };

  const openEditStaff = (staff: any) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      password: '',
      category: staff.category || 'Hair',
      status: staff.status || 'active',
      specialty: staff.specialty || '',
      role: staff.role || 'staff'
    });
    setSelectedServiceIds(staff.assigned_service_ids || []);
    setIsEditStaffOpen(true);
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
      <div className="flex justify-end mb-6">
        <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add New Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Enter the details for the new staff member below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter initial password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Primary Service Category *</Label>
                <Select value={staffForm.category} onValueChange={(value) => {
                  setStaffForm(prev => ({ ...prev, category: value }));
                  setSelectedServiceIds([]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hair">Hair</SelectItem>
                    <SelectItem value="Facial">Facial</SelectItem>
                    <SelectItem value="Nails">Nails</SelectItem>
                    <SelectItem value="Massage">Massage</SelectItem>
                    <SelectItem value="Wellness">Wellness</SelectItem>
                    <SelectItem value="Beauty">Beauty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={staffForm.status === 'active'}
                  onCheckedChange={(checked) => setStaffForm(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                />
                <Label htmlFor="active">Active Status</Label>
              </div>
              {services.length > 0 && (
                <div className="space-y-2">
                  <Label>Assign Services <span className="text-xs text-gray-400 font-normal">(filtered by category)</span></Label>
                  {(() => {
                    const filtered = services.filter((s: any) =>
                      s.category?.toLowerCase() === staffForm.category?.toLowerCase()
                    );
                    if (filtered.length === 0) return (
                      <p className="text-xs text-gray-400 italic px-1">No services found for "{staffForm.category}" category.</p>
                    );
                    return (
                      <>
                        <div className="border border-purple-100 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 bg-purple-50/30">
                          {filtered.map((service: any) => (
                            <label key={service.id} className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-1.5 rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                className="accent-purple-500 w-4 h-4"
                                checked={selectedServiceIds.includes(service.id)}
                                onChange={(e) => {
                                  setSelectedServiceIds(prev =>
                                    e.target.checked
                                      ? [...prev, service.id]
                                      : prev.filter(id => id !== service.id)
                                  );
                                }}
                              />
                              <span className="text-sm text-gray-700">{service.name}</span>
                            </label>
                          ))}
                        </div>
                        {selectedServiceIds.length > 0 && (
                          <p className="text-xs text-purple-600">{selectedServiceIds.length} service(s) selected</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => {
                setIsAddStaffOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                Add Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Staff</p>
                <p className="text-3xl font-bold">{staffMembers.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Staff</p>
                <p className="text-3xl font-bold">{staffMembers.filter(s => s.status === 'active').length}</p>
              </div>
              <Award className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Avg Rating</p>
                <p className="text-3xl font-bold">{staffMembers.length > 0 ? (staffMembers.reduce((acc, s) => acc + s.rating, 0) / staffMembers.length).toFixed(1) : '0.0'}</p>
              </div>
              <Star className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl shadow-xl text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100">Total Completed</p>
                <p className="text-3xl font-bold">{staffMembers.reduce((acc, s) => acc + s.appointments, 0)}</p>
              </div>
              <Clock className="w-10 h-10 text-pink-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search staff by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40 border-purple-200 focus:border-purple-400 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Hair">Hair</SelectItem>
                  <SelectItem value="Facial">Facial</SelectItem>
                  <SelectItem value="Nails">Nails</SelectItem>
                  <SelectItem value="Massage">Massage</SelectItem>
                  <SelectItem value="Wellness">Wellness</SelectItem>
                  <SelectItem value="Beauty">Beauty</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 border-purple-200 focus:border-purple-400 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Staff Members ({filteredStaff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed Appts</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">#{staff.id.toString().padStart(3, '0')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <StaffAvatar staff={staff} size="sm" />
                          <div>
                            <div className="font-medium">{staff.name}</div>
                            <div className="text-sm text-gray-500">{staff.specialty}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-purple-200 text-purple-700">
                          {staff.category || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStaffStatusColor(staff.status)}>
                          {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{staff.appointments}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{staff.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleViewDetails(staff)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50"
                            onClick={() => openEditStaff(staff)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {staff.name} from the staff? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStaff(staff.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove Staff
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredStaff.map((staff) => (
                <Card key={staff.id} className="p-4 border-purple-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <StaffAvatar staff={staff} size="md" />
                      <div>
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-500">#{staff.id.toString().padStart(3, '0')}</div>
                      </div>
                    </div>
                    <Badge className={getStaffStatusColor(staff.status)}>
                      {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500 block">Category</span>
                      <span className="font-medium">{staff.category || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Rating</span>
                      <span className="font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {staff.rating.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Completed</span>
                      <span className="font-medium">{staff.appointments} Appts</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 block">Email</span>
                      <span className="font-medium">{staff.email}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-3 border-t border-purple-50">
                    <Button variant="outline" size="sm" className="flex-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" onClick={() => handleViewDetails(staff)}>
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100" onClick={() => openEditStaff(staff)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {staff.name} from the staff? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteStaff(staff.id)} className="bg-red-600 hover:bg-red-700">
                            Remove Staff
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
            {filteredStaff.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No staff members found matching your search criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update the details for {editingStaff?.name || 'this staff member'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-blue-700 font-medium">ℹ Admin Note</p>
              <p className="text-xs text-blue-600 mt-0.5">Admins can update Role, Category, and Status. Personal details are managed by the staff member.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="flex items-center gap-2">
                Full Name
                <Badge variant="outline" className="text-[10px] py-0 h-4 border-gray-200 text-gray-400">Read-only</Badge>
              </Label>
              <Input
                id="edit-name"
                value={staffForm.name}
                disabled
                className="bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="flex items-center gap-2">
                Email
                <Badge variant="outline" className="text-[10px] py-0 h-4 border-gray-200 text-gray-400">Read-only</Badge>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={staffForm.email}
                disabled
                className="bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="flex items-center gap-2">
                Phone
                <Badge variant="outline" className="text-[10px] py-0 h-4 border-gray-200 text-gray-400">Read-only</Badge>
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={staffForm.phone}
                disabled
                className="bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Staff Role *</Label>
              <Select value={staffForm.role} onValueChange={(value) => setStaffForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Primary Service Category *</Label>
              <Select value={staffForm.category} onValueChange={(value) => {
                setStaffForm(prev => ({ ...prev, category: value }));
                setSelectedServiceIds([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hair">Hair</SelectItem>
                  <SelectItem value="Facial">Facial</SelectItem>
                  <SelectItem value="Nails">Nails</SelectItem>
                  <SelectItem value="Massage">Massage</SelectItem>
                  <SelectItem value="Wellness">Wellness</SelectItem>
                  <SelectItem value="Beauty">Beauty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="edit-active"
                checked={staffForm.status === 'active'}
                onCheckedChange={(checked) => setStaffForm(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
              />
              <Label htmlFor="edit-active">Active Status</Label>
            </div>
            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Assign Services <span className="text-xs text-gray-400 font-normal">(filtered by category)</span></Label>
                {(() => {
                  const filtered = services.filter((s: any) =>
                    s.category?.toLowerCase() === staffForm.category?.toLowerCase()
                  );
                  if (filtered.length === 0) return (
                    <p className="text-xs text-gray-400 italic px-1">No services found for "{staffForm.category}" category.</p>
                  );
                  return (
                    <>
                      <div className="border border-purple-100 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 bg-purple-50/30">
                        {filtered.map((service: any) => (
                          <label key={service.id} className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-1.5 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              className="accent-purple-500 w-4 h-4"
                              checked={selectedServiceIds.includes(service.id)}
                              onChange={(e) => {
                                setSelectedServiceIds(prev =>
                                  e.target.checked
                                    ? [...prev, service.id]
                                    : prev.filter(id => id !== service.id)
                                );
                              }}
                            />
                            <span className="text-sm text-gray-700">{service.name}</span>
                          </label>
                        ))}
                      </div>
                      {selectedServiceIds.length > 0 && (
                        <p className="text-xs text-purple-600">{selectedServiceIds.length} service(s) selected</p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditStaffOpen(false);
              setEditingStaff(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleEditStaff}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Staff Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Assigned Services</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStaff.assigned_service_ids?.length > 0 ? (
                    selectedStaff.assigned_service_ids.map((id: number) => {
                      const service = services.find(s => s.id === id);
                      return (
                        <Badge key={id} variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 px-3 py-1 text-xs font-medium rounded-lg">
                          {service ? service.name : `Service #${id}`}
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-400 italic">No services assigned yet</p>
                  )}
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

              <div className="flex gap-3 pb-2">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 rounded-xl py-2.5"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    openEditStaff(selectedStaff);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl py-2.5 shadow-sm"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setActiveSection('appointments');
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Schedule
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
