import { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Search, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getStatusColor } from '../../shared/utils/statusColors';

interface AppointmentsPanelProps {
  appointments: any[];
  onSelect: (appointment: any) => void;
}

export function AppointmentsPanel({ appointments, onSelect }: AppointmentsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
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
              onClick={() => onSelect(appointment)}
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
}
