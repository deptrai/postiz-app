'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import dayjs from 'dayjs';

interface ExperimentVariant {
  id: string;
  variantId: string;
  label: string;
  contentCount: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number | null;
  winRate: number | null;
  variant: {
    id: string;
    name: string;
    type: string;
  };
}

interface Experiment {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  successMetric: string;
  winnerId: string | null;
  createdAt: string;
  playbook?: {
    id: string;
    name: string;
  };
  variants?: ExperimentVariant[];
}

interface Playbook {
  id: string;
  name: string;
  variants?: {
    id: string;
    name: string;
    type: string;
  }[];
}

export const ExperimentsListPage: FC = () => {
  const fetch = useFetch();
  const t = useT();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create experiment form state
  const [createForm, setCreateForm] = useState({
    name: '',
    playbookId: '',
    variantIds: [] as string[],
    successMetric: 'engagement' as 'reach' | 'engagement' | 'combined',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlaybookVariants, setSelectedPlaybookVariants] = useState<any[]>([]);

  const loadExperiments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await fetch(`/experiments?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setExperiments(data.experiments);
      }
    } catch (err) {
      setError('Failed to load experiments');
    } finally {
      setIsLoading(false);
    }
  }, [fetch, statusFilter]);

  const loadPlaybooks = useCallback(async () => {
    try {
      const response = await fetch('/playbooks');
      const data = await response.json();
      if (data.success) {
        setPlaybooks(data.playbooks);
      }
    } catch (err) {
      console.error('Failed to load playbooks', err);
    }
  }, [fetch]);

  const loadPlaybookVariants = useCallback(async (playbookId: string) => {
    try {
      const response = await fetch(`/playbooks/${playbookId}/variants`);
      const data = await response.json();
      if (data.success) {
        setSelectedPlaybookVariants(data.variants);
      }
    } catch (err) {
      console.error('Failed to load variants', err);
    }
  }, [fetch]);

  const createExperiment = useCallback(async () => {
    if (!createForm.name || !createForm.playbookId || createForm.variantIds.length < 2) {
      setError('Please fill all required fields and select at least 2 variants');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/experiments', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          playbookId: '',
          variantIds: [],
          successMetric: 'engagement',
        });
        loadExperiments();
      } else {
        setError(data.message || 'Failed to create experiment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create experiment');
    } finally {
      setIsCreating(false);
    }
  }, [fetch, createForm, loadExperiments]);

  const startExperiment = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/experiments/${id}/start`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        loadExperiments();
        if (selectedExperiment?.id === id) {
          setSelectedExperiment(data.experiment);
        }
      }
    } catch (err) {
      console.error('Failed to start experiment', err);
    }
  }, [fetch, loadExperiments, selectedExperiment]);

  const completeExperiment = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/experiments/${id}/complete`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        loadExperiments();
        if (selectedExperiment?.id === id) {
          setSelectedExperiment(data.experiment);
        }
      }
    } catch (err) {
      console.error('Failed to complete experiment', err);
    }
  }, [fetch, loadExperiments, selectedExperiment]);

  useEffect(() => {
    loadExperiments();
    loadPlaybooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500/20 text-gray-400';
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handlePlaybookChange = (playbookId: string) => {
    setCreateForm({ ...createForm, playbookId, variantIds: [] });
    if (playbookId) {
      loadPlaybookVariants(playbookId);
    } else {
      setSelectedPlaybookVariants([]);
    }
  };

  const toggleVariantSelection = (variantId: string) => {
    const current = createForm.variantIds;
    if (current.includes(variantId)) {
      setCreateForm({ ...createForm, variantIds: current.filter((id) => id !== variantId) });
    } else if (current.length < 3) {
      setCreateForm({ ...createForm, variantIds: [...current, variantId] });
    }
  };

  if (isLoading) {
    return <LoadingComponent />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textColor">{t('experiments', 'Experiments')}</h1>
          <p className="text-textColor/60 text-sm mt-1">
            {t('experiments_description', 'Create A/B/C experiments to test playbook variants')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-customColor10 text-white rounded-lg font-medium hover:bg-customColor10/80 transition-all"
        >
          {t('create_experiment', 'Create Experiment')}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['all', 'draft', 'active', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              statusFilter === status
                ? 'bg-customColor10 text-white'
                : 'bg-newBgColorInner text-textColor/60 hover:text-textColor'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {experiments.length === 0 && (
        <div className="text-center py-12 bg-newBgColorInner rounded-lg">
          <p className="text-textColor/60 mb-4">{t('no_experiments_found', 'No experiments found')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-customColor10 text-white rounded-lg font-medium hover:bg-customColor10/80 transition-all"
          >
            {t('create_your_first_experiment', 'Create Your First Experiment')}
          </button>
        </div>
      )}

      {/* Experiments Table */}
      {experiments.length > 0 && (
        <div className="bg-newBgColorInner rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-newBgColor">
                <th className="text-left p-4 text-textColor/60 font-medium text-sm">{t('name', 'Name')}</th>
                <th className="text-left p-4 text-textColor/60 font-medium text-sm">{t('playbook', 'Playbook')}</th>
                <th className="text-left p-4 text-textColor/60 font-medium text-sm">{t('status', 'Status')}</th>
                <th className="text-left p-4 text-textColor/60 font-medium text-sm">{t('variants', 'Variants')}</th>
                <th className="text-left p-4 text-textColor/60 font-medium text-sm">{t('metric', 'Metric')}</th>
                <th className="text-left p-4 text-textColor/60 font-medium text-sm">{t('created', 'Created')}</th>
                <th className="text-right p-4 text-textColor/60 font-medium text-sm">{t('actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((experiment) => (
                <tr
                  key={experiment.id}
                  className="border-b border-newBgColor hover:bg-newBgColor/50 cursor-pointer"
                  onClick={() => setSelectedExperiment(experiment)}
                >
                  <td className="p-4 text-textColor font-medium">{experiment.name}</td>
                  <td className="p-4 text-textColor/80">{experiment.playbook?.name || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(experiment.status)}`}>
                      {experiment.status}
                    </span>
                  </td>
                  <td className="p-4 text-textColor/80">
                    {experiment.variants?.map((v) => v.label).join(', ') || '-'}
                  </td>
                  <td className="p-4 text-textColor/80 capitalize">{experiment.successMetric}</td>
                  <td className="p-4 text-textColor/60 text-sm">
                    {dayjs(experiment.createdAt).format('MMM D, YYYY')}
                  </td>
                  <td className="p-4 text-right">
                    {experiment.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startExperiment(experiment.id);
                        }}
                        className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                      >
                        {t('start', 'Start')}
                      </button>
                    )}
                    {experiment.status === 'active' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          completeExperiment(experiment.id);
                        }}
                        className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                      >
                        {t('complete', 'Complete')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Experiment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-newBgColor rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-textColor">{t('create_experiment', 'Create Experiment')}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-textColor/60 hover:text-textColor"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-textColor mb-1">
                  {t('experiment_name', 'Experiment Name')}
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-newBgColorInner border border-newBgColor rounded-lg text-textColor"
                  placeholder="e.g., Hook Style Test"
                />
              </div>

              {/* Playbook Selection */}
              <div>
                <label className="block text-sm font-medium text-textColor mb-1">
                  {t('select_playbook', 'Select Playbook')}
                </label>
                <select
                  value={createForm.playbookId}
                  onChange={(e) => handlePlaybookChange(e.target.value)}
                  className="w-full px-3 py-2 bg-newBgColorInner border border-newBgColor rounded-lg text-textColor"
                >
                  <option value="">Choose a playbook...</option>
                  {playbooks.map((pb) => (
                    <option key={pb.id} value={pb.id}>
                      {pb.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant Selection */}
              {selectedPlaybookVariants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-textColor mb-1">
                    {t('select_2_3_variants', 'Select 2-3 variants to test')}
                  </label>
                  <div className="space-y-2">
                    {selectedPlaybookVariants.map((variant) => (
                      <label
                        key={variant.id}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                          createForm.variantIds.includes(variant.id)
                            ? 'bg-customColor10/20 border border-customColor10'
                            : 'bg-newBgColorInner border border-transparent hover:border-newBgColor'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={createForm.variantIds.includes(variant.id)}
                          onChange={() => toggleVariantSelection(variant.id)}
                          className="mr-3"
                        />
                        <div>
                          <span className="text-textColor font-medium">{variant.name}</span>
                          <span className="ml-2 px-2 py-0.5 bg-customColor10/20 text-customColor10 text-xs rounded-full capitalize">
                            {variant.type}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedPlaybookVariants.length === 0 && createForm.playbookId && (
                    <p className="text-textColor/60 text-sm">
                      No variants found. Generate variants for this playbook first.
                    </p>
                  )}
                </div>
              )}

              {/* Success Metric */}
              <div>
                <label className="block text-sm font-medium text-textColor mb-1">
                  {t('success_metric', 'Success Metric')}
                </label>
                <select
                  value={createForm.successMetric}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      successMetric: e.target.value as 'reach' | 'engagement' | 'combined',
                    })
                  }
                  className="w-full px-3 py-2 bg-newBgColorInner border border-newBgColor rounded-lg text-textColor"
                >
                  <option value="engagement">{t('engagement', 'Engagement')}</option>
                  <option value="reach">{t('reach', 'Reach')}</option>
                  <option value="combined">{t('combined', 'Combined')}</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-textColor/60 hover:text-textColor"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                onClick={createExperiment}
                disabled={isCreating || createForm.variantIds.length < 2}
                className="px-4 py-2 bg-customColor10 text-white rounded-lg font-medium hover:bg-customColor10/80 transition-all disabled:opacity-50"
              >
                {isCreating ? t('creating', 'Creating...') : t('create_experiment', 'Create Experiment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Experiment Detail Modal */}
      {selectedExperiment && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedExperiment(null)}
        >
          <div
            className="bg-newBgColor rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-textColor">{selectedExperiment.name}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedExperiment.status)}`}>
                  {selectedExperiment.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedExperiment(null)}
                className="text-textColor/60 hover:text-textColor"
              >
                ✕
              </button>
            </div>

            {/* Experiment Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-newBgColorInner p-3 rounded-lg">
                <p className="text-xs text-textColor/60 mb-1">Playbook</p>
                <p className="text-textColor">{selectedExperiment.playbook?.name || '-'}</p>
              </div>
              <div className="bg-newBgColorInner p-3 rounded-lg">
                <p className="text-xs text-textColor/60 mb-1">Success Metric</p>
                <p className="text-textColor capitalize">{selectedExperiment.successMetric}</p>
              </div>
            </div>

            {/* Variants Performance */}
            <div className="mb-6">
              <h3 className="font-semibold text-textColor mb-3">Variant Performance</h3>
              <div className="space-y-3">
                {selectedExperiment.variants?.map((v) => (
                  <div
                    key={v.id}
                    className={`p-4 rounded-lg ${
                      selectedExperiment.winnerId === v.id
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-newBgColorInner'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 flex items-center justify-center bg-customColor10/20 text-customColor10 rounded-full font-bold">
                          {v.label}
                        </span>
                        <span className="text-textColor font-medium">{v.variant.name}</span>
                        {selectedExperiment.winnerId === v.id && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Winner
                          </span>
                        )}
                      </div>
                      {v.winRate !== null && (
                        <span className="text-lg font-bold text-customColor10">
                          {v.winRate.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-textColor/60">Content</p>
                        <p className="text-textColor font-medium">{v.contentCount}</p>
                      </div>
                      <div>
                        <p className="text-textColor/60">Total Reach</p>
                        <p className="text-textColor font-medium">{v.totalReach.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-textColor/60">Total Engagement</p>
                        <p className="text-textColor font-medium">{v.totalEngagement.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {selectedExperiment.status === 'draft' && (
                <button
                  onClick={() => startExperiment(selectedExperiment.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                >
                  Start Experiment
                </button>
              )}
              {selectedExperiment.status === 'active' && (
                <button
                  onClick={() => completeExperiment(selectedExperiment.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                >
                  Complete Experiment
                </button>
              )}
              <button
                onClick={() => setSelectedExperiment(null)}
                className="px-4 py-2 bg-customColor10 text-white rounded-lg font-medium hover:bg-customColor10/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
