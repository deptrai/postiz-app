'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { clsx } from 'clsx';

interface NotificationPreferencesData {
  id: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  kpiDropEnabled: boolean;
  viralSpikeEnabled: boolean;
  criticalEnabled: boolean;
  warningEnabled: boolean;
  infoEnabled: boolean;
  digestEnabled: boolean;
  digestFrequency: string;
}

export const NotificationPreferences: FC = () => {
  const fetch = useFetch();
  const [data, setData] = useState<NotificationPreferencesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/notifications/preferences');
      setData(response as unknown as NotificationPreferencesData);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreference = useCallback(
    async (key: keyof NotificationPreferencesData, value: boolean | string) => {
      if (!data) return;

      setSaving(true);
      try {
        const response = await fetch('/notifications/preferences', {
          method: 'PUT',
          body: JSON.stringify({ [key]: value }),
        });
        setData(response as unknown as NotificationPreferencesData);
      } catch (e) {
        console.error('Failed to update preference', e);
      } finally {
        setSaving(false);
      }
    },
    [fetch, data]
  );

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading preferences. Please try again.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Notification Preferences</h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure how you want to receive alerts
        </p>
      </div>

      {saving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving...
        </div>
      )}

      {/* Notification Channels */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>📢</span> Notification Channels
        </h3>
        <div className="space-y-4">
          <ToggleItem
            label="In-App Notifications"
            description="Show notifications in the app"
            checked={data?.inAppEnabled ?? true}
            onChange={(v) => updatePreference('inAppEnabled', v)}
          />
          <ToggleItem
            label="Email Notifications"
            description="Receive alerts via email"
            checked={data?.emailEnabled ?? true}
            onChange={(v) => updatePreference('emailEnabled', v)}
          />
        </div>
      </div>

      {/* Alert Types */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>🔔</span> Alert Types
        </h3>
        <div className="space-y-4">
          <ToggleItem
            label="KPI Drop Alerts"
            description="Get notified when metrics drop significantly"
            checked={data?.kpiDropEnabled ?? true}
            onChange={(v) => updatePreference('kpiDropEnabled', v)}
            icon="⚠️"
          />
          <ToggleItem
            label="Viral Spike Alerts"
            description="Get notified when content goes viral"
            checked={data?.viralSpikeEnabled ?? true}
            onChange={(v) => updatePreference('viralSpikeEnabled', v)}
            icon="🔥"
          />
        </div>
      </div>

      {/* Severity Levels */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>📊</span> Severity Levels
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Choose which severity levels trigger notifications
        </p>
        <div className="space-y-4">
          <ToggleItem
            label="Critical"
            description="Major drops (>50%) or mega viral content"
            checked={data?.criticalEnabled ?? true}
            onChange={(v) => updatePreference('criticalEnabled', v)}
            color="red"
          />
          <ToggleItem
            label="Warning"
            description="Moderate drops (30-50%) or viral content"
            checked={data?.warningEnabled ?? true}
            onChange={(v) => updatePreference('warningEnabled', v)}
            color="yellow"
          />
          <ToggleItem
            label="Info"
            description="Minor drops (20-30%) or trending content"
            checked={data?.infoEnabled ?? false}
            onChange={(v) => updatePreference('infoEnabled', v)}
            color="blue"
          />
        </div>
      </div>

      {/* Digest Settings */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>📬</span> Email Digest
        </h3>
        <div className="space-y-4">
          <ToggleItem
            label="Enable Digest"
            description="Receive a summary instead of individual emails"
            checked={data?.digestEnabled ?? false}
            onChange={(v) => updatePreference('digestEnabled', v)}
          />
          {data?.digestEnabled && (
            <div className="ml-4 pl-4 border-l-2 border-gray-600">
              <label className="text-sm text-gray-400 block mb-2">
                Digest Frequency
              </label>
              <select
                value={data?.digestFrequency ?? 'daily'}
                onChange={(e) =>
                  updatePreference('digestFrequency', e.target.value)
                }
                className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ToggleItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: string;
  color?: 'red' | 'yellow' | 'blue';
}

const ToggleItem: FC<ToggleItemProps> = ({
  label,
  description,
  checked,
  onChange,
  icon,
  color,
}) => {
  const colorClasses = {
    red: 'peer-checked:bg-red-500',
    yellow: 'peer-checked:bg-yellow-500',
    blue: 'peer-checked:bg-blue-500',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon && <span className="text-xl">{icon}</span>}
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-sm text-gray-400">{description}</div>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={clsx(
            'w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer',
            'after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px]',
            'after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all',
            'peer-checked:after:translate-x-full peer-checked:after:border-white',
            color ? colorClasses[color] : 'peer-checked:bg-blue-500'
          )}
        ></div>
      </label>
    </div>
  );
};

export default NotificationPreferences;
