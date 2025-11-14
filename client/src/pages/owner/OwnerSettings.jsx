import Card from '../../components/Card';
import Toggle from '../../components/Toggle';
import Button from '../../components/Button';
import { useState } from 'react';

const OwnerSettings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    autoBackup: true,
  });

  const handleSave = () => {
    // Save settings logic
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
      <Card title="System Settings">
        <div className="space-y-4">
          <Toggle
            label="Enable Notifications"
            enabled={settings.notifications}
            onChange={(value) => setSettings({ ...settings, notifications: value })}
          />
          <Toggle
            label="Email Alerts"
            enabled={settings.emailAlerts}
            onChange={(value) => setSettings({ ...settings, emailAlerts: value })}
          />
          <Toggle
            label="Auto Backup"
            enabled={settings.autoBackup}
            onChange={(value) => setSettings({ ...settings, autoBackup: value })}
          />
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OwnerSettings;
