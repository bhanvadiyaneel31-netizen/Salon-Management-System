import { api } from '../../../services/api';
import { ProfileSettingsPanel } from '../../ProfileSettingsPanel';

interface ProfilePanelProps {
  profile: {
    name: string;
    email: string;
    phone: string;
    address: string;
    profile_image: string;
    loyaltyPoints: number;
    totalAppointments: number;
  };
  onSave: (updatedUser: any) => void;
}

export function ProfilePanel({
  profile,
  onSave
}: ProfilePanelProps) {
  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">Manage your account and preferences</p>
      <ProfileSettingsPanel
        userData={{
          ...api.auth.getCurrentUser(),
          profile_image: profile.profile_image,
        }}
        onSave={onSave}
        previewStats={[
          { label: 'Points', value: profile.loyaltyPoints },
          { label: 'Visits', value: profile.totalAppointments },
        ]}
      />
    </div>
  );
}
