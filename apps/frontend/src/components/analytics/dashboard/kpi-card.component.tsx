'use client';

import { FC } from 'react';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const KPICard: FC<KPICardProps> = ({ title, value, subtitle, icon, trend }) => {
  return (
    <div className="bg-newBgColorInner p-6 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-textColor/60 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-textColor">{value}</h3>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-textColor/40 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-customColor10 opacity-60">{icon}</div>}
      </div>
    </div>
  );
};
