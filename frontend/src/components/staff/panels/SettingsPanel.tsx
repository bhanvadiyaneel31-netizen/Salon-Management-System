import { Card } from '../../ui/card';
import { ProfileSettingsPanel } from '../../ProfileSettingsPanel';

interface SettingsPanelProps {
  userData: any;
  staffRating: { average: number; count: number };
  onSave: (updatedUser: any) => void;
}

export function SettingsPanel({ userData, staffRating, onSave }: SettingsPanelProps) {
  if (userData?.role === 'admin') {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center">
        <p className="text-gray-500">Admin users do not have profile settings here. Use the admin management panel instead.</p>
      </Card>
    );
  }
  return (
    <ProfileSettingsPanel
      userData={userData}
      onSave={onSave}
      previewStats={[
        { label: 'Rating', value: `${staffRating.average}⭐` },
        { label: 'Reviews', value: staffRating.count }
      ]}
    />
  );
}
