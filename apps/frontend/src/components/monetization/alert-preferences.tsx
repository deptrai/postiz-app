'use client';

import { FC, useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export interface AlertPreferencesData {
  monetizationMilestoneEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  criticalEnabled: boolean;
  warningEnabled: boolean;
  infoEnabled: boolean;
}

export interface AlertPreferencesProps {
  preferences: AlertPreferencesData;
  onSave: (preferences: AlertPreferencesData) => Promise<void>;
  onCancel: () => void;
}

const ToggleSwitch: FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}> = ({ enabled, onChange, label, description }) => {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1">
        <label className="text-sm font-medium text-textColor cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-textColor/60 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${enabled ? 'bg-blue-500' : 'bg-gray-700'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
};

export const AlertPreferences: FC<AlertPreferencesProps> = ({
  preferences: initialPreferences,
  onSave,
  onCancel,
}) => {
  const t = useT();
  const [preferences, setPreferences] = useState<AlertPreferencesData>(initialPreferences);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(preferences);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof AlertPreferencesData, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-newBgColorInner rounded-lg p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-textColor">
            {t('alert_preferences_title', 'Alert Preferences')}
          </h3>
          <p className="text-sm text-textColor/60 mt-1">
            {t('alert_preferences_description', 'Manage how you receive monetization alerts')}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Alert Types Section */}
        <div>
          <h4 className="text-sm font-semibold text-textColor mb-3">
            {t('alert_types', 'Alert Types')}
          </h4>
          <div className="space-y-2 bg-newBgColor rounded-lg p-4">
            <ToggleSwitch
              enabled={preferences.monetizationMilestoneEnabled}
              onChange={(value) => updatePreference('monetizationMilestoneEnabled', value)}
              label={t('monetization_milestones', 'Monetization Milestones')}
              description={t('monetization_milestones_desc', 'Get notified when you reach 80%, 90%, and 100% progress')}
            />
          </div>
        </div>

        {/* Channels Section */}
        <div>
          <h4 className="text-sm font-semibold text-textColor mb-3">
            {t('notification_channels', 'Notification Channels')}
          </h4>
          <div className="space-y-2 bg-newBgColor rounded-lg p-4">
            <ToggleSwitch
              enabled={preferences.inAppEnabled}
              onChange={(value) => updatePreference('inAppEnabled', value)}
              label={t('in_app_notifications', 'In-App Notifications')}
              description={t('in_app_notifications_desc', 'Show alerts within the dashboard')}
            />
            <ToggleSwitch
              enabled={preferences.emailEnabled}
              onChange={(value) => updatePreference('emailEnabled', value)}
              label={t('email_notifications', 'Email Notifications')}
              description={t('email_notifications_desc', 'Receive alerts via email')}
            />
          </div>
        </div>

        {/* Severity Section */}
        <div>
          <h4 className="text-sm font-semibold text-textColor mb-3">
            {t('alert_severity', 'Alert Severity')}
          </h4>
          <div className="space-y-2 bg-newBgColor rounded-lg p-4">
            <ToggleSwitch
              enabled={preferences.criticalEnabled}
              onChange={(value) => updatePreference('criticalEnabled', value)}
              label={t('critical_alerts', 'Critical Alerts')}
              description={t('critical_alerts_desc', 'Important issues requiring immediate attention')}
            />
            <ToggleSwitch
              enabled={preferences.warningEnabled}
              onChange={(value) => updatePreference('warningEnabled', value)}
              label={t('warning_alerts', 'Warning Alerts')}
              description={t('warning_alerts_desc', 'Progress drops and potential issues')}
            />
            <ToggleSwitch
              enabled={preferences.infoEnabled}
              onChange={(value) => updatePreference('infoEnabled', value)}
              label={t('info_alerts', 'Info Alerts')}
              description={t('info_alerts_desc', 'General updates and milestone achievements')}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-700/50">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? t('saving', 'Saving...') : t('save_preferences', 'Save Preferences')}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-textColor rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('cancel', 'Cancel')}
        </button>
      </div>
    </div>
  );
};
