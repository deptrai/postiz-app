'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { SyncStatusComponent } from '@gitroom/frontend/components/analytics/sync-status.component';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import dayjs from 'dayjs';

interface PlaybookRecipe {
  format: string;
  captionBucket: {
    hooks: string[];
    ctaPatterns: string[];
  };
  hashtagBucket: string[];
  timeBucket: {
    bestHours: number[];
    bestDays: number[];
  };
}

interface Playbook {
  id: string;
  name: string;
  format: string;
  recipe: PlaybookRecipe;
  medianReach: number | null;
  medianViews: number | null;
  avgEngagementRate: number | null;
  consistencyScore: number | null;
  contentCount: number;
  createdAt: string;
  group?: {
    id: string;
    name: string;
    niche: string | null;
  } | null;
}

interface PlaybookVariant {
  id: string;
  playbookId: string;
  name: string;
  type: string;
  recipe: PlaybookRecipe;
  description: string | null;
  createdAt: string;
}

interface PlaybooksResponse {
  success: boolean;
  count: number;
  playbooks: Playbook[];
}

export const PlaybooksListPage: FC = () => {
  const fetch = useFetch();
  const t = useT();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [variants, setVariants] = useState<PlaybookVariant[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);

  const loadPlaybooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/playbooks');
      const data: PlaybooksResponse = await response.json();
      if (data.success) {
        setPlaybooks(data.playbooks);
      }
    } catch (err) {
      setError('Failed to load playbooks');
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  const generatePlaybooks = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/playbooks/generate', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        await loadPlaybooks();
      } else {
        setError(data.message || 'Failed to generate playbooks');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate playbooks');
    } finally {
      setIsGenerating(false);
    }
  }, [fetch, loadPlaybooks]);

  const loadVariants = useCallback(async (playbookId: string) => {
    setIsLoadingVariants(true);
    try {
      const response = await fetch(`/playbooks/${playbookId}/variants`);
      const data = await response.json();
      if (data.success) {
        setVariants(data.variants);
      }
    } catch (err) {
      console.error('Failed to load variants', err);
    } finally {
      setIsLoadingVariants(false);
    }
  }, [fetch]);

  const generateVariants = useCallback(async (playbookId: string) => {
    setIsGeneratingVariants(true);
    try {
      const response = await fetch(`/playbooks/${playbookId}/variants/generate`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setVariants(data.variants);
      }
    } catch (err) {
      console.error('Failed to generate variants', err);
    } finally {
      setIsGeneratingVariants(false);
    }
  }, [fetch]);

  const handleSelectPlaybook = useCallback((playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setVariants([]);
    loadVariants(playbook.id);
  }, [loadVariants]);

  // Load playbooks on mount
  useEffect(() => {
    loadPlaybooks();
  }, [loadPlaybooks]);

  const formatNumber = (num: number | null): string => {
    if (num === null) return '-';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getDayName = (day: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day] || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textColor">{t('playbooks', 'Playbooks')}</h1>
          <p className="text-textColor/60 text-sm mt-1">
            {t('winning_formulas_extracted_from_your_top_performing_content', 'Winning formulas extracted from your top-performing content')}
          </p>
          <SyncStatusComponent compact className="mt-2" />
        </div>
        <button
          onClick={generatePlaybooks}
          disabled={isGenerating}
          className="px-4 py-2 bg-customColor10 text-white rounded-lg font-medium hover:bg-customColor10/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? t('generating', 'Generating...') : t('generate_playbooks', 'Generate Playbooks')}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {playbooks.length === 0 && !error && (
        <div className="bg-newBgColorInner p-8 rounded-lg text-center">
          <div className="text-textColor/60">
            <p className="text-lg font-medium mb-2">{t('no_playbooks_yet', 'No playbooks yet')}</p>
            <p className="text-sm">
              {t('click_generate_playbooks', 'Click "Generate Playbooks" to analyze your top content and create winning formulas.')}
            </p>
            <p className="text-sm mt-2">
              {t('need_3_content_items', 'You need at least 3 content items from the last 30 days.')}
            </p>
          </div>
        </div>
      )}

      {/* Playbooks Grid */}
      {playbooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playbooks.map((playbook) => (
            <div
              key={playbook.id}
              className="bg-newBgColorInner p-5 rounded-lg cursor-pointer hover:ring-2 hover:ring-customColor10/50 transition-all"
              onClick={() => handleSelectPlaybook(playbook)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-textColor">{playbook.name}</h3>
                  {playbook.group && (
                    <span className="text-xs text-textColor/60">
                      {playbook.group.name}
                    </span>
                  )}
                </div>
                <span className="px-2 py-1 bg-customColor10/20 text-customColor10 text-xs rounded-full capitalize">
                  {playbook.format}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-textColor/60">{t('median_reach', 'Median Reach')}</p>
                  <p className="text-lg font-semibold text-textColor">
                    {formatNumber(playbook.medianReach)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-textColor/60">{t('engagement_rate', 'Engagement Rate')}</p>
                  <p className="text-lg font-semibold text-textColor">
                    {playbook.avgEngagementRate?.toFixed(2) || '-'}%
                  </p>
                </div>
              </div>

              {/* Consistency Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-textColor/60">{t('consistency_score', 'Consistency Score')}</span>
                  <span className="text-textColor">{playbook.consistencyScore || 0}%</span>
                </div>
                <div className="h-2 bg-newBgColor rounded-full overflow-hidden">
                  <div
                    className="h-full bg-customColor10 rounded-full"
                    style={{ width: `${playbook.consistencyScore || 0}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-textColor/60">
                <span>{playbook.contentCount} {t('source_items', 'source items')}</span>
                <span>{dayjs(playbook.createdAt).format('MMM D, YYYY')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Playbook Detail Modal */}
      {selectedPlaybook && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPlaybook(null);
          }}
        >
          <div className="bg-newBgColorInner p-6 rounded-lg w-[600px] max-w-[90vw] max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-textColor">
                  {selectedPlaybook.name}
                </h2>
                {selectedPlaybook.group && (
                  <span className="text-sm text-textColor/60">
                    {selectedPlaybook.group.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedPlaybook(null)}
                className="text-textColor/60 hover:text-textColor"
              >
                ✕
              </button>
            </div>

            {/* Recipe Sections */}
            <div className="space-y-6">
              {/* Hooks */}
              {selectedPlaybook.recipe.captionBucket.hooks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-textColor mb-2">{t('hook_patterns', 'Hook Patterns')}</h3>
                  <div className="space-y-2">
                    {selectedPlaybook.recipe.captionBucket.hooks.map((hook, i) => (
                      <div
                        key={i}
                        className="bg-newBgColor p-3 rounded-lg text-sm text-textColor/80"
                      >
                        "{hook}..."
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Patterns */}
              {selectedPlaybook.recipe.captionBucket.ctaPatterns.length > 0 && (
                <div>
                  <h3 className="font-semibold text-textColor mb-2">{t('cta_patterns', 'CTA Patterns')}</h3>
                  <div className="space-y-2">
                    {selectedPlaybook.recipe.captionBucket.ctaPatterns.map((cta, i) => (
                      <div
                        key={i}
                        className="bg-newBgColor p-3 rounded-lg text-sm text-textColor/80"
                      >
                        {cta}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {selectedPlaybook.recipe.hashtagBucket.length > 0 && (
                <div>
                  <h3 className="font-semibold text-textColor mb-2">{t('top_hashtags', 'Top Hashtags')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlaybook.recipe.hashtagBucket.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-customColor10/20 text-customColor10 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Times */}
              <div>
                <h3 className="font-semibold text-textColor mb-2">{t('best_posting_times', 'Best Posting Times')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-newBgColor p-3 rounded-lg">
                    <p className="text-xs text-textColor/60 mb-1">{t('best_hours', 'Best Hours')}</p>
                    <p className="text-textColor">
                      {selectedPlaybook.recipe.timeBucket.bestHours
                        .map((h) => `${h}:00`)
                        .join(', ') || '-'}
                    </p>
                  </div>
                  <div className="bg-newBgColor p-3 rounded-lg">
                    <p className="text-xs text-textColor/60 mb-1">{t('best_days', 'Best Days')}</p>
                    <p className="text-textColor">
                      {selectedPlaybook.recipe.timeBucket.bestDays
                        .map(getDayName)
                        .join(', ') || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics Summary */}
              <div>
                <h3 className="font-semibold text-textColor mb-2">{t('performance_evidence', 'Performance Evidence')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-newBgColor p-3 rounded-lg text-center">
                    <p className="text-xs text-textColor/60 mb-1">{t('median_reach', 'Median Reach')}</p>
                    <p className="text-lg font-semibold text-textColor">
                      {formatNumber(selectedPlaybook.medianReach)}
                    </p>
                  </div>
                  <div className="bg-newBgColor p-3 rounded-lg text-center">
                    <p className="text-xs text-textColor/60 mb-1">{t('engagement_rate', 'Engagement Rate')}</p>
                    <p className="text-lg font-semibold text-textColor">
                      {selectedPlaybook.avgEngagementRate?.toFixed(2) || '-'}%
                    </p>
                  </div>
                  <div className="bg-newBgColor p-3 rounded-lg text-center">
                    <p className="text-xs text-textColor/60 mb-1">{t('consistency', 'Consistency')}</p>
                    <p className="text-lg font-semibold text-textColor">
                      {selectedPlaybook.consistencyScore || 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-textColor">{t('variants', 'Variants')}</h3>
                  <button
                    onClick={() => generateVariants(selectedPlaybook.id)}
                    disabled={isGeneratingVariants}
                    className="px-3 py-1 text-sm bg-customColor10/20 text-customColor10 rounded-lg hover:bg-customColor10/30 transition-all disabled:opacity-50"
                  >
                    {isGeneratingVariants ? t('generating_variants', 'Generating...') : t('generate_variants', 'Generate Variants')}
                  </button>
                </div>
                
                {isLoadingVariants && (
                  <p className="text-sm text-textColor/60">{t('loading_variants', 'Loading variants...')}</p>
                )}
                
                {!isLoadingVariants && variants.length === 0 && (
                  <p className="text-sm text-textColor/60">
                    {t('no_variants_yet', 'No variants yet. Click "Generate Variants" to create hook, time, and hashtag variations.')}
                  </p>
                )}
                
                {variants.length > 0 && (
                  <div className="space-y-2">
                    {variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="bg-newBgColor p-3 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-textColor text-sm">{variant.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(variant.recipe, null, 2));
                                alert(t('recipe_copied', 'Recipe copied to clipboard!'));
                              }}
                              className="px-2 py-0.5 text-xs bg-customColor10/20 text-customColor10 rounded hover:bg-customColor10/30"
                              title={t('copy', 'Copy')}
                            >
                              {t('copy', 'Copy')}
                            </button>
                            <span className="px-2 py-0.5 bg-customColor10/20 text-customColor10 text-xs rounded-full capitalize">
                              {variant.type}
                            </span>
                          </div>
                        </div>
                        {variant.description && (
                          <p className="text-xs text-textColor/60">{variant.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPlaybook(null)}
                className="px-4 py-2 bg-customColor10 text-white rounded-lg font-medium hover:bg-customColor10/80 transition-all"
              >
                {t('close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
