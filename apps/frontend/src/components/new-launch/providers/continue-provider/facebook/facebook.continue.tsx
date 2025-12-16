'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { Button } from '@gitroom/react/form/button';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useCustomProviderFunction } from '@gitroom/frontend/components/launches/helpers/use.custom.provider.function';
import { useIntegration } from '@gitroom/frontend/components/launches/helpers/use.integration';
export const FacebookContinue: FC<{
  closeModal: () => void;
  existingId: string[];
}> = (props) => {
  const { closeModal, existingId } = props;
  const call = useCustomProviderFunction();
  const { integration } = useIntegration();
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const fetch = useFetch();
  const loadPages = useCallback(async () => {
    try {
      const pages = await call.get('pages');
      return pages;
    } catch (e) {
      closeModal();
    }
  }, []);
  const togglePage = useCallback(
    (id: string) => () => {
      setSelectedPages((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    },
    []
  );
  const { data, isLoading } = useSWR('load-pages', loadPages, {
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });
  const t = useT();

  const filteredData = useMemo(() => {
    return (
      data?.filter((p: { id: string }) => !existingId.includes(p.id)) || []
    );
  }, [data, existingId]);

  const selectAll = useCallback(() => {
    const allIds = filteredData?.map((p: { id: string }) => p.id) || [];
    setSelectedPages(new Set(allIds));
  }, [filteredData]);

  const deselectAll = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const savePages = useCallback(async () => {
    if (selectedPages.size === 0) return;
    setIsSaving(true);
    try {
      await fetch(`/integrations/facebook/${integration?.id}/bulk`, {
        method: 'POST',
        body: JSON.stringify({
          pages: Array.from(selectedPages),
        }),
      });
      closeModal();
    } catch (e) {
      console.error('Failed to save pages:', e);
    } finally {
      setIsSaving(false);
    }
  }, [integration, selectedPages, fetch, closeModal]);
  if (!isLoading && !data?.length) {
    return (
      <div className="text-center flex justify-center items-center text-[18px] leading-[50px] h-[300px]">
        {t(
          'we_couldn_t_find_any_business_connected_to_the_selected_pages',
          "We couldn't find any business connected to the selected pages."
        )}
        <br />
        {t(
          'we_recommend_you_to_connect_all_the_pages_and_all_the_businesses',
          'We recommend you to connect all the pages and all the businesses.'
        )}
        <br />
        {t(
          'please_close_this_dialog_delete_your_integration_and_add_a_new_channel_again',
          'Please close this dialog, delete your integration and add a new channel\n        again.'
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex items-center justify-between">
        <div>{t('select_pages', 'Select Pages:')}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm text-customColor10 hover:underline"
          >
            {t('select_all', 'Select All')}
          </button>
          <span className="text-textColor/40">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-sm text-customColor10 hover:underline"
          >
            {t('deselect_all', 'Deselect All')}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 justify-items-center select-none cursor-pointer gap-2">
        {filteredData?.map(
          (p: {
            id: string;
            username: string;
            name: string;
            picture: {
              data: {
                url: string;
              };
            };
          }) => (
            <div
              key={p.id}
              className={clsx(
                'flex flex-col w-full text-center gap-[10px] border border-input p-[10px] hover:bg-seventh relative',
                selectedPages.has(p.id) && 'bg-seventh border-customColor10'
              )}
              onClick={togglePage(p.id)}
            >
              {selectedPages.has(p.id) && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-customColor10 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div>
                <img
                  className="w-full"
                  src={p.picture.data.url}
                  alt="profile"
                />
              </div>
              <div>{p.name}</div>
            </div>
          )
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-textColor/60">
          {selectedPages.size} {t('pages_selected', 'page(s) selected')}
        </span>
        <Button disabled={selectedPages.size === 0 || isSaving} onClick={savePages}>
          {isSaving ? t('saving', 'Saving...') : t('add_selected_pages', 'Add Selected Pages')}
        </Button>
      </div>
    </div>
  );
};
