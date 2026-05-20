export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'completed': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
