'use client';

import { FC, useState } from 'react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@gitroom/frontend/hooks/use-tags';

export const TagManagementPage: FC = () => {
  const { data: tags, isLoading, error, mutate } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newTagName.trim()) return;

    try {
      await createTag(newTagName);
      setNewTagName('');
      setIsCreating(false);
      mutate();
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingTag || !editingTag.name.trim()) return;

    try {
      await updateTag(editingTag.id, editingTag.name);
      setEditingTag(null);
      mutate();
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      await deleteTag(tagId);
      setDeletingTagId(null);
      mutate();
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-textColor/60">Loading tags...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-red-500">Error loading tags</div>
      </div>
    );
  }

  const manualTags = tags?.filter((t) => t.type === 'MANUAL') || [];
  const autoTags = tags?.filter((t) => t.type === 'AUTO') || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-textColor">Tag Management</h1>
        <button 
          onClick={() => setIsCreating(true)} 
          className="px-4 py-2 bg-customColor10 text-white rounded-md hover:bg-customColor10/90"
        >
          Create Campaign Tag
        </button>
      </div>

      {/* Create Tag Form */}
      {isCreating && (
        <div className="bg-newBgColorInner p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Create New Campaign Tag</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name..."
              className="flex-1 h-[40px] bg-boxBg text-textColor rounded-md px-3 outline-none border border-fifth focus:border-customColor10"
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button 
              onClick={handleCreate} 
              className="px-4 py-2 bg-customColor10 text-white rounded-md hover:bg-customColor10/90"
            >
              Create
            </button>
            <button 
              onClick={() => {
                setIsCreating(false);
                setNewTagName('');
              }} 
              className="px-4 py-2 bg-fifth text-textColor rounded-md hover:bg-fifth/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Manual Campaign Tags */}
      <div className="bg-newBgColorInner p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">🏷️</span>
          Campaign Tags
          <span className="text-sm text-textColor/60 font-normal">({manualTags.length})</span>
        </h2>

        {manualTags.length === 0 ? (
          <div className="text-center py-8 text-textColor/40">
            No campaign tags yet. Create one to organize your content.
          </div>
        ) : (
          <div className="space-y-2">
            {manualTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 bg-boxBg rounded-md hover:bg-boxBg/80"
              >
                {editingTag?.id === tag.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTag.name}
                      onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                      className="flex-1 h-[32px] bg-newBgColorInner text-textColor rounded px-2 outline-none border border-fifth focus:border-customColor10"
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
                    />
                    <button 
                      onClick={handleUpdate} 
                      className="px-3 py-1 bg-customColor10 text-white text-sm rounded hover:bg-customColor10/90"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingTag(null)} 
                      className="px-3 py-1 bg-fifth text-textColor text-sm rounded hover:bg-fifth/80"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-customColor10/20 text-customColor10 rounded text-xs font-medium">
                        MANUAL
                      </span>
                      <span className="font-medium text-textColor">{tag.name}</span>
                      <span className="text-sm text-textColor/60">
                        {tag._count.content} {tag._count.content === 1 ? 'post' : 'posts'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingTag({ id: tag.id, name: tag.name })}
                        className="text-xs px-3 py-1 text-customColor10 hover:bg-customColor10/10 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingTagId(tag.id)}
                        className="text-xs px-3 py-1 text-red-500 hover:bg-red-500/10 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto Tags */}
      <div className="bg-newBgColorInner p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          Auto Tags
          <span className="text-sm text-textColor/60 font-normal">({autoTags.length})</span>
        </h2>

        {autoTags.length === 0 ? (
          <div className="text-center py-8 text-textColor/40">
            No auto tags yet. Auto-tagging will extract keywords from content.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {autoTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-2 bg-boxBg rounded hover:bg-boxBg/80"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium flex-shrink-0">
                    AUTO
                  </span>
                  <span className="text-sm text-textColor truncate">{tag.name}</span>
                </div>
                <span className="text-xs text-textColor/60 ml-2 flex-shrink-0">
                  {tag._count.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTagId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-newBgColorInner p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-3">Delete Tag?</h3>
            <p className="text-textColor/60 mb-4">
              This will remove the tag from all content. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setDeletingTagId(null)} 
                className="px-4 py-2 bg-fifth text-textColor rounded-md hover:bg-fifth/80"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deletingTagId)} 
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
