import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export interface Tag {
  id: string;
  name: string;
  type: 'AUTO' | 'MANUAL';
  _count: {
    content: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const useTags = (type?: 'AUTO' | 'MANUAL') => {
  const fetch = useFetch();

  return useSWR<Tag[]>(
    type ? ['tags', type] : 'tags',
    async () => {
      const params = type ? `?type=${type}` : '';
      return await (await fetch(`/analytics/tags${params}`)).json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
};

export const useCreateTag = () => {
  const fetch = useFetch();

  return async (name: string) => {
    return await (
      await fetch('/analytics/tags', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
    ).json();
  };
};

export const useUpdateTag = () => {
  const fetch = useFetch();

  return async (tagId: string, name: string) => {
    return await (
      await fetch(`/analytics/tags/${tagId}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      })
    ).json();
  };
};

export const useDeleteTag = () => {
  const fetch = useFetch();

  return async (tagId: string) => {
    return await fetch(`/analytics/tags/${tagId}`, {
      method: 'DELETE',
    });
  };
};

export const useAssignTag = () => {
  const fetch = useFetch();

  return async (contentId: string, tagId: string) => {
    return await (
      await fetch(`/analytics/content/${contentId}/tags`, {
        method: 'POST',
        body: JSON.stringify({ tagId }),
      })
    ).json();
  };
};

export const useRemoveTag = () => {
  const fetch = useFetch();

  return async (contentId: string, tagId: string) => {
    return await fetch(`/analytics/content/${contentId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  };
};
