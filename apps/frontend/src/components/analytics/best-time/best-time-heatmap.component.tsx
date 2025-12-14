'use client';

import { FC, useState } from 'react';
import { useBestTime } from '@gitroom/frontend/hooks/use-best-time';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

interface BestTimeHeatmapProps {
  groupId?: string;
}

export const BestTimeHeatmap: FC<BestTimeHeatmapProps> = ({ groupId }) => {
  const [days, setDays] = useState<7 | 14>(7);
  const [format, setFormat] = useState<'all' | 'post' | 'reel'>('all');
  const { data, isLoading, error } = useBestTime(groupId, format, days);

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
          <div className="text-red-500">Error loading best time data</div>
        </div>
      </div>
    );
  }

  const minRequired = 10;
  const hasEnoughData = (data?.totalContent || 0) >= minRequired;

  return (
    <div className="bg-newBgColorInner p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-2xl">⏰</span>
          Best Time to Post
        </h3>
        <div className="flex gap-2">
          <DaysSelector value={days} onChange={setDays} />
          <FormatSelector value={format} onChange={setFormat} />
        </div>
      </div>

      {hasEnoughData ? (
        <>
          <HeatmapGrid data={data!.heatmap} />
          <TopRecommendations recommendations={data!.recommendations} />
        </>
      ) : (
        <InsufficientDataMessage minRequired={minRequired} current={data?.totalContent || 0} />
      )}
    </div>
  );
};

interface DaysSelectorProps {
  value: 7 | 14;
  onChange: (value: 7 | 14) => void;
}

const DaysSelector: FC<DaysSelectorProps> = ({ value, onChange }) => (
  <div className="flex gap-1 bg-boxBg rounded-md p-1">
    {([7, 14] as const).map((d) => (
      <button
        key={d}
        onClick={() => onChange(d)}
        className={`px-3 py-1 rounded text-sm transition-colors ${
          value === d
            ? 'bg-customColor10 text-white'
            : 'text-textColor/60 hover:text-textColor'
        }`}
      >
        {d}d
      </button>
    ))}
  </div>
);

interface FormatSelectorProps {
  value: 'all' | 'post' | 'reel';
  onChange: (value: 'all' | 'post' | 'reel') => void;
}

const FormatSelector: FC<FormatSelectorProps> = ({ value, onChange }) => (
  <div className="flex gap-1 bg-boxBg rounded-md p-1">
    {(['all', 'post', 'reel'] as const).map((f) => (
      <button
        key={f}
        onClick={() => onChange(f)}
        className={`px-3 py-1 rounded text-sm transition-colors capitalize ${
          value === f
            ? 'bg-customColor10 text-white'
            : 'text-textColor/60 hover:text-textColor'
        }`}
      >
        {f}
      </button>
    ))}
  </div>
);

interface HeatmapGridProps {
  data: any[][];
}

const HeatmapGrid: FC<HeatmapGridProps> = ({ data }) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const maxEngagement = Math.max(...data.flat().map((cell) => cell.engagement));

  const getColor = (engagement: number, confidence: number): string => {
    if (confidence < 0.2) return 'bg-boxBg';

    const intensity = maxEngagement > 0 ? engagement / maxEngagement : 0;
    if (intensity > 0.8) return 'bg-green-500';
    if (intensity > 0.6) return 'bg-green-400';
    if (intensity > 0.4) return 'bg-yellow-400';
    if (intensity > 0.2) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="overflow-x-auto mb-4">
      <div className="min-w-[800px]">
        <div className="flex mb-1">
          <div className="w-[60px]"></div>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="flex-1 text-center text-xs text-textColor/60">
              {i}
            </div>
          ))}
        </div>

        {data.map((day, dayIdx) => (
          <div key={dayIdx} className="flex gap-0.5 mb-0.5">
            <div className="w-[60px] text-sm text-textColor/60 flex items-center">
              {dayNames[dayIdx]}
            </div>
            {day.map((cell, hourIdx) => (
              <HeatmapCell
                key={hourIdx}
                cell={cell}
                color={getColor(cell.engagement, cell.confidence)}
                day={dayNames[dayIdx]}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-3 text-xs text-textColor/60">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-boxBg rounded"></div>
          <span>Low data</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-400 rounded"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
};

interface HeatmapCellProps {
  cell: any;
  color: string;
  day: string;
}

const HeatmapCell: FC<HeatmapCellProps> = ({ cell, color, day }) => (
  <div
    className={`flex-1 aspect-square ${color} rounded-sm cursor-pointer hover:opacity-80 relative group`}
    title={`${day} ${cell.hour}:00\n${cell.engagement} avg engagement\n${cell.count} posts`}
  >
    <div className="hidden group-hover:block absolute z-10 bg-black text-white text-xs p-2 rounded -top-[60px] left-1/2 -translate-x-1/2 whitespace-nowrap">
      <div>
        {day} {cell.hour}:00-{cell.hour + 1}:00
      </div>
      <div>{cell.engagement} avg engagement</div>
      <div>{cell.count} posts</div>
    </div>
  </div>
);

interface TopRecommendationsProps {
  recommendations: any[];
}

const TopRecommendations: FC<TopRecommendationsProps> = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Top Recommended Times:</h4>
      <div className="space-y-2">
        {recommendations.slice(0, 3).map((rec, index) => (
          <div key={index} className="p-3 bg-boxBg rounded-md flex items-center gap-3">
            <div className="text-xl font-bold text-customColor10 min-w-[32px]">#{index + 1}</div>
            <div className="flex-1">
              <div className="font-medium text-textColor">
                {rec.dayName} at {rec.timeRange}
              </div>
              <div className="text-sm text-textColor/60">
                Avg {rec.avgEngagement} engagement ({rec.contentCount} posts)
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-textColor/60">Confidence</div>
              <div className="font-medium text-textColor">
                {Math.round(rec.confidenceScore * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface InsufficientDataMessageProps {
  minRequired: number;
  current: number;
}

const InsufficientDataMessage: FC<InsufficientDataMessageProps> = ({ minRequired, current }) => (
  <div className="text-center text-textColor/40 py-12">
    <p className="text-lg mb-2">Insufficient Data</p>
    <p className="text-sm">
      Need at least {minRequired} posts. Currently have {current} posts.
    </p>
    <p className="text-xs mt-2">Post more content or expand the time range to get recommendations.</p>
  </div>
);
