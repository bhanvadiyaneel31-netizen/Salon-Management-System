import { ManageServicePanel } from '../../ManageServicePanel';

interface ManageServicesPanelProps {
  defaultTab?: 'services' | 'staff' | 'appointments';
}

export function ManageServicesPanel({ defaultTab = 'services' }: ManageServicesPanelProps) {
  return <ManageServicePanel defaultTab={defaultTab} />;
}
