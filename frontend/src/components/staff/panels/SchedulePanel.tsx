import { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, isToday, isFuture, isAfter } from 'date-fns';
import { getStatusColor } from '../../shared/utils/statusColors';

interface SchedulePanelProps {
  appointments: any[];
  onUpdateStatus: (id: string, status: any) => void;
}

export function SchedulePanel({ appointments, onUpdateStatus }: SchedulePanelProps) {
  const [scheduleFilter, setScheduleFilter] = useState<'today' | 'upcoming'>('today');

  return (
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
              .map((a) => (
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
                            onUpdateStatus(a.id, 'in-progress');
                          }}
                        >Start</Button>
                      )}
                      {a.status === 'in-progress' && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(a.id, 'completed');
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
            {appointments.filter(a => {
              const date = new Date(a.date);
              if (scheduleFilter === 'today') return isToday(date);
              if (scheduleFilter === 'upcoming') {
                const apptDateTime = new Date(`${a.date}T${a.time}`);
                return isFuture(date) || (isToday(date) && isAfter(apptDateTime, new Date()));
              }
              return true;
            }).length === 0 && (
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
}
