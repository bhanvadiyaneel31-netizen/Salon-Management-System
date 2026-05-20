export interface Notification {
  id: string;
  type: 'new_appointment' | 'reminder' | 'update' | 'cancellation' | string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  appointment_id?: string;
}
