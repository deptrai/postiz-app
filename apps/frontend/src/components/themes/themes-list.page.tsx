'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { ThemeTrendingWidget } from './theme-trending.widget';

interface Theme {
  id: string;
  name: string;
  keywords: string[];
  contentCount: number;
  avgReach: number | null;
  avgEngagement: number | null;
  avgEngagementRate: number | null;
  createdAt: string;
  content?: {
    id: string;
    contentId: string;
    similarity: number | null;
  }[];
}

interface ThemeContent {
  id: string;
  externalContentId: string;
  contentType: string;
  caption: string | null;
  hashtags: string | null;
  publishedAt: string;
  similarity: number | null;
}

export const ThemesListPage: FC = () => {
  const fetch = useFetch();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClustering, setIsClustering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [themeContent, setThemeContent] = useState<ThemeContent[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  
  // Merge state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [mergeName, setMergeName] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  
  // History state
  const [themeHistory, setThemeHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadThemes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/themes');
      const data = await response.json();
      if (data.success) {
        setThemes(data.themes);
      }
    } catch (err) {
      setError('Failed to load themes');
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  const runClustering = useCallback(async () => {
    setIsClustering(true);
    setError(null);
    try {
      const response = await fetch('/themes/cluster', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setThemes(data.themes);
      } else {
        setError(data.message || 'Clustering failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run clustering');
    } finally {
      setIsClustering(false);
    }
  }, [fetch]);

  const loadThemeContent = useCallback(async (themeId: string) => {
    setIsLoadingContent(true);
    try {
      const response = await fetch(`/themes/${themeId}/content`);
      const data = await response.json();
      if (data.success) {
        setThemeContent(data.content);
      }
    } catch (err) {
      console.error('Failed to load theme content', err);
    } finally {
      setIsLoadingContent(false);
    }
  }, [fetch]);

  const handleSelectTheme = useCallback((theme: Theme) => {
    setSelectedTheme(theme);
    setThemeContent([]);
    setNewName(theme.name);
    setShowHistory(false);
    loadThemeContent(theme.id);
  }, [loadThemeContent]);

  const renameTheme = useCallback(async () => {
    if (!selectedTheme || !newName.trim()) return;
    setIsRenaming(true);
    try {
      const response = await fetch(`/themes/${selectedTheme.id}/rename`, {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedTheme({ ...selectedTheme, name: newName.trim() });
        loadThemes();
      }
    } catch (err) {
      console.error('Failed to rename theme', err);
    } finally {
      setIsRenaming(false);
    }
  }, [fetch, selectedTheme, newName, loadThemes]);

  const mergeThemes = useCallback(async () => {
    if (selectedForMerge.length < 2 || !mergeName.trim()) return;
    setIsMerging(true);
    try {
      const response = await fetch('/themes/merge', {
        method: 'POST',
        body: JSON.stringify({ themeIds: selectedForMerge, targetName: mergeName.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setShowMergeModal(false);
        setSelectedForMerge([]);
        setMergeName('');
        loadThemes();
      } else {
        setError(data.message || 'Failed to merge themes');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to merge themes');
    } finally {
      setIsMerging(false);
    }
  }, [fetch, selectedForMerge, mergeName, loadThemes]);

  const loadThemeHistory = useCallback(async (themeId: string) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/themes/${themeId}/history`);
      const data = await response.json();
      if (data.success) {
        setThemeHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [fetch]);

  const toggleMergeSelection = (themeId: string) => {
    setSelectedForMerge((prev) =>
      prev.includes(themeId)
        ? prev.filter((id) => id !== themeId)
        : [...prev, themeId]
    );
  };

  useEffect(() => {
    loadThemes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatNumber = (num: number | null): string => {
    if (num === null) return '-';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  if (isLoading) {
    return <LoadingComponent />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textColor">Themes</h1>
          <p className="text-textColor/60 text-sm mt-1">
            Content clusters based on keywords and hashtags
          </p>
        </div>
        <div className="flex gap-2">
          {selectedForMerge.length >= 2 && (
            <button
              onClick={() => setShowMergeModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
            >
              Merge ({selectedForMerge.length})
            </button>
          )}
          <button
            onClick={runClustering}
            disabled={isClustering}
            className="px-4 py-2 bg-customColor10 text-white rounded-lg font-medium hover:bg-customColor10/80 transition-all disabled:opacity-50"
          >
            {isClustering ? 'Clustering...' : 'Run Clustering'}
          </button>
        </div>
      </div>

      {/* Trending Themes Widget */}
      {themes.length > 0 && (
        <div className="mb-6">
          <ThemeTrendingWidget limit={5} showTopContent={true} />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Empty State */}
      {themes.length === 0 && (
        <div className="text-center py-12 bg-newBgColorInner rounded-lg">
          <p className="text-textColor/60 mb-4">No themes yet</p>
          <p className="text-textColor/40 text-sm mb-6">
            Click "Run Clustering" to analyze your content and create themes based on keywords.
          </p>
          <button
            onClick={runClustering}
            disabled={isClustering}
            className="px-4 py-2 bg-customColor10 text-white rounded-lg font-medium hover:bg-customColor10/80 transition-all disabled:opacity-50"
          >
            {isClustering ? 'Clustering...' : 'Run Clustering'}
          </button>
        </div>
      )}

      {/* Themes Grid */}
      {themes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`bg-newBgColorInner p-5 rounded-lg cursor-pointer hover:ring-2 hover:ring-customColor10/50 transition-all ${
                selectedForMerge.includes(theme.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleSelectTheme(theme)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedForMerge.includes(theme.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleMergeSelection(theme.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded"
                  />
                  <h3 className="font-semibold text-textColor">{theme.name}</h3>
                </div>
                <span className="px-2 py-1 bg-customColor10/20 text-customColor10 text-xs rounded-full">
                  {theme.contentCount} items
                </span>
              </div>

              {/* Keywords */}
              <div className="flex flex-wrap gap-1 mb-4">
                {theme.keywords.slice(0, 5).map((keyword, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-newBgColor text-textColor/70 text-xs rounded"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-textColor/60">Avg Reach</p>
                  <p className="text-sm font-medium text-textColor">
                    {formatNumber(theme.avgReach)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-textColor/60">Avg Engagement</p>
                  <p className="text-sm font-medium text-textColor">
                    {formatNumber(theme.avgEngagement)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-textColor/60">Eng. Rate</p>
                  <p className="text-sm font-medium text-textColor">
                    {theme.avgEngagementRate?.toFixed(1) || '-'}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Theme Detail Modal */}
      {selectedTheme && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedTheme(null)}
        >
          <div
            className="bg-newBgColor rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Rename */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-xl font-bold text-textColor bg-transparent border-b border-transparent hover:border-textColor/30 focus:border-customColor10 outline-none flex-1"
                />
                {newName !== selectedTheme.name && (
                  <button
                    onClick={renameTheme}
                    disabled={isRenaming}
                    className="px-3 py-1 text-sm bg-customColor10 text-white rounded-lg hover:bg-customColor10/80 disabled:opacity-50"
                  >
                    {isRenaming ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedTheme(null)}
                className="text-textColor/60 hover:text-textColor ml-4"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-newBgColorInner">
              <button
                onClick={() => setShowHistory(false)}
                className={`pb-2 px-1 text-sm font-medium ${
                  !showHistory
                    ? 'text-customColor10 border-b-2 border-customColor10'
                    : 'text-textColor/60 hover:text-textColor'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => {
                  setShowHistory(true);
                  loadThemeHistory(selectedTheme.id);
                }}
                className={`pb-2 px-1 text-sm font-medium ${
                  showHistory
                    ? 'text-customColor10 border-b-2 border-customColor10'
                    : 'text-textColor/60 hover:text-textColor'
                }`}
              >
                History
              </button>
            </div>

            {/* History Tab */}
            {showHistory && (
              <div>
                {isLoadingHistory && (
                  <p className="text-sm text-textColor/60">Loading history...</p>
                )}
                {!isLoadingHistory && themeHistory.length === 0 && (
                  <p className="text-sm text-textColor/60">No history for this theme.</p>
                )}
                {themeHistory.length > 0 && (
                  <div className="space-y-3">
                    {themeHistory.map((entry) => (
                      <div key={entry.id} className="bg-newBgColorInner p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 bg-customColor10/20 text-customColor10 text-xs rounded-full capitalize">
                            {entry.action}
                          </span>
                          <span className="text-xs text-textColor/60">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-textColor/80">
                          {entry.action === 'rename' && (
                            <p>
                              Renamed from "{(entry.previousState as any)?.name}" to "{(entry.newState as any)?.name}"
                            </p>
                          )}
                          {entry.action === 'merge' && (
                            <p>Merged from {entry.relatedThemeIds?.length || 0} themes</p>
                          )}
                          {entry.action === 'split' && (
                            <p>Split into {(entry.newState as any)?.splitInto?.length || 0} themes</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Details Tab */}
            {!showHistory && (
              <>
            {/* Keywords */}
            <div className="mb-6">
              <h3 className="font-semibold text-textColor mb-2">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTheme.keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-customColor10/20 text-customColor10 text-sm rounded-full"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="mb-6">
              <h3 className="font-semibold text-textColor mb-2">Performance Metrics</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-newBgColorInner p-3 rounded-lg text-center">
                  <p className="text-xs text-textColor/60 mb-1">Content</p>
                  <p className="text-lg font-semibold text-textColor">
                    {selectedTheme.contentCount}
                  </p>
                </div>
                <div className="bg-newBgColorInner p-3 rounded-lg text-center">
                  <p className="text-xs text-textColor/60 mb-1">Avg Reach</p>
                  <p className="text-lg font-semibold text-textColor">
                    {formatNumber(selectedTheme.avgReach)}
                  </p>
                </div>
                <div className="bg-newBgColorInner p-3 rounded-lg text-center">
                  <p className="text-xs text-textColor/60 mb-1">Avg Engagement</p>
                  <p className="text-lg font-semibold text-textColor">
                    {formatNumber(selectedTheme.avgEngagement)}
                  </p>
                </div>
                <div className="bg-newBgColorInner p-3 rounded-lg text-center">
                  <p className="text-xs text-textColor/60 mb-1">Eng. Rate</p>
                  <p className="text-lg font-semibold text-textColor">
                    {selectedTheme.avgEngagementRate?.toFixed(1) || '-'}%
                  </p>
                </div>
              </div>
            </div>

            {/* Content List */}
            <div>
              <h3 className="font-semibold text-textColor mb-2">
                Associated Content ({themeContent.length})
              </h3>
              
              {isLoadingContent && (
                <p className="text-sm text-textColor/60">Loading content...</p>
              )}
              
              {!isLoadingContent && themeContent.length === 0 && (
                <p className="text-sm text-textColor/60">No content associated with this theme.</p>
              )}
              
              {themeContent.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {themeContent.map((content) => (
                    <div
                      key={content.id}
                      className="bg-newBgColorInner p-3 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-textColor/60 capitalize">
                          {content.contentType}
                        </span>
                        {content.similarity !== null && (
                          <span className="text-xs text-customColor10">
                            {(content.similarity * 100).toFixed(0)}% match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-textColor line-clamp-2">
                        {content.caption || 'No caption'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTheme(null)}
                className="px-4 py-2 bg-customColor10 text-white rounded-lg font-medium hover:bg-customColor10/80 transition-all"
              >
                Close
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowMergeModal(false)}
        >
          <div
            className="bg-newBgColor rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-textColor mb-4">Merge Themes</h2>
            <p className="text-sm text-textColor/60 mb-4">
              Merging {selectedForMerge.length} themes into one.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-textColor mb-1">
                New Theme Name
              </label>
              <input
                type="text"
                value={mergeName}
                onChange={(e) => setMergeName(e.target.value)}
                className="w-full px-3 py-2 bg-newBgColorInner border border-newBgColor rounded-lg text-textColor"
                placeholder="Enter merged theme name..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMergeModal(false);
                  setSelectedForMerge([]);
                  setMergeName('');
                }}
                className="px-4 py-2 text-textColor/60 hover:text-textColor"
              >
                Cancel
              </button>
              <button
                onClick={mergeThemes}
                disabled={isMerging || !mergeName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {isMerging ? 'Merging...' : 'Merge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
