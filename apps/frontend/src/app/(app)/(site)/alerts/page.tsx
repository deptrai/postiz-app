'use client';

import { useState } from 'react';
import { AlertHistory } from '@gitroom/frontend/components/alerts/alert-history';
import { AlertConfig } from '@gitroom/frontend/components/alerts/alert-config';
import { ViralHistory } from '@gitroom/frontend/components/alerts/viral-history';
import { clsx } from 'clsx';

type Tab = 'alerts' | 'viral' | 'config';

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('alerts');

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts & Viral Detection</h1>
          <p className="text-gray-400 mt-1">
            Monitor KPI drops and viral content spikes
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={clsx(
            'px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2',
            activeTab === 'alerts'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <span>⚠️</span> KPI Alerts
        </button>
        <button
          onClick={() => setActiveTab('viral')}
          className={clsx(
            'px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2',
            activeTab === 'viral'
              ? 'bg-green-800 text-green-300'
              : 'text-gray-400 hover:text-green-300'
          )}
        >
          <span>🔥</span> Viral Content
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={clsx(
            'px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2',
            activeTab === 'config'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <span>⚙️</span> Configuration
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        {activeTab === 'alerts' && <AlertHistory />}
        {activeTab === 'viral' && <ViralHistory />}
        {activeTab === 'config' && <AlertConfig />}
      </div>
    </div>
  );
}
