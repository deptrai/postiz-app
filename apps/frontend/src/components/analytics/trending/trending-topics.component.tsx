'use client';

import { FC, useState } from 'react';
import { useTrendingTopics } from '@gitroom/frontend/hooks/use-trending-topics';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

interface TrendingTopicsWidgetProps {
  groupId?: string;
}

export const TrendingTopicsWidget: FC<TrendingTopicsWidgetProps> = ({ groupId }) => {
  const [timeWindow, setTimeWindow] = useState<'24h' | '48h' | '72h'>('24h');
  const { data, isLoading, error } = useTrendingTopics(groupId, timeWindow, 10);

  if (isLoading) {
    return (
      <div className="bg-newBgColorInner p-6 rounded-lg">
        <div className="flex items-center justify-center h-[200px]">
          <LoadingComponent />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-newBgColorInner p-6 rounded-lg">
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-red-500">Error loading trending topics</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-newBgColorInner p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          Trending Topics
        </h3>
        <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
      </div>

      {data?.trending && data.trending.length > 0 ? (
        <div className="space-y-3">
          {data.trending.map((item, index) => (
            <TrendingTopicItem key={item.tag.id} item={item} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="text-center text-textColor/40 py-8">
          No trending topics in selected period
        </div>
      )}
    </div>
  );
};

interface TimeWindowSelectorProps {
  value: '24h' | '48h' | '72h';
  onChange: (value: '24h' | '48h' | '72h') => void;
}

const TimeWindowSelector: FC<TimeWindowSelectorProps> = ({ value, onChange }) => (
  <div className="flex gap-1 bg-boxBg rounded-md p-1">
    {(['24h', '48h', '72h'] as const).map((window) => (
      <button
        key={window}
        onClick={() => onChange(window)}
        className={`px-3 py-1 rounded text-sm transition-colors ${
          value === window
            ? 'bg-customColor10 text-white'
            : 'text-textColor/60 hover:text-textColor'
        }`}
      >
        {window}
      </button>
    ))}
  </div>
);

interface TrendingTopicItemProps {
  item: any;
  rank: number;
}

const TrendingTopicItem: FC<TrendingTopicItemProps> = ({ item, rank }) => (
  <div className="p-4 bg-boxBg rounded-md flex items-center gap-3">
    <div className="text-xl font-bold text-textColor/40 min-w-[32px]">#{rank}</div>

    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-textColor">{item.tag.name}</span>
        {item.tag.type === 'MANUAL' && (
          <span className="text-xs px-2 py-0.5 bg-customColor10/20 text-customColor10 rounded-full">
            CAMPAIGN
          </span>
        )}
        {item.isNew && (
          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
            NEW
          </span>
        )}
      </div>

      <div className="text-sm text-textColor/60 mb-2">{item.whyTrending}</div>

      <div className="flex gap-4 text-xs text-textColor/60">
        <span>
          {item.currentMentions} mentions
          {item.mentionVelocity > 0 && (
            <span className="text-green-400 ml-1">↗️ +{item.mentionVelocity}%</span>
          )}
        </span>
        <span>
          {item.currentAvgEngagement} avg engagement
          {item.engagementVelocity > 0 && (
            <span className="text-green-400 ml-1">↗️ +{item.engagementVelocity}%</span>
          )}
        </span>
      </div>
    </div>

    <div className="text-right">
      <div className="text-xl font-bold text-green-400">
        +{item.velocityScore}%
      </div>
      <div className="text-xs text-textColor/60">velocity</div>
    </div>
  </div>
);
