import React, { useState, useEffect } from 'react';
import { draftPostsService, DraftPost } from '../services/draftPostsService';
import { CloseIcon } from '../constants';

interface DraftPostsProps {
    userId: string;
    campaignId?: number;
    onClose: () => void;
    onPublish?: (draft: DraftPost) => void;
}

const DraftPosts: React.FC<DraftPostsProps> = ({ userId, campaignId, onClose, onPublish }) => {
    const [drafts, setDrafts] = useState<DraftPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDraft, setSelectedDraft] = useState<DraftPost | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        loadDrafts();
    }, [userId, campaignId]);

    const loadDrafts = async () => {
        setLoading(true);
        try {
            const data = campaignId 
                ? await draftPostsService.getCampaignDrafts(userId, campaignId)
                : await draftPostsService.getUserDrafts(userId);
            setDrafts(data);
        } catch (error) {
            console.error('Failed to load drafts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (draft: DraftPost) => {
        setSelectedDraft(draft);
        setEditTitle(draft.title);
        setEditContent(draft.content);
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedDraft) return;

        try {
            await draftPostsService.updateDraft(selectedDraft.id!, {
                title: editTitle,
                content: editContent
            });
            await loadDrafts();
            setIsEditing(false);
            setSelectedDraft(null);
        } catch (error) {
            console.error('Failed to update draft:', error);
            alert('Failed to update draft');
        }
    };

    const handleDelete = async (draftId: number) => {
        if (!confirm('Are you sure you want to delete this draft?')) return;

        try {
            await draftPostsService.deleteDraft(draftId);
            await loadDrafts();
        } catch (error) {
            console.error('Failed to delete draft:', error);
            alert('Failed to delete draft');
        }
    };

    const handlePublish = async (draft: DraftPost) => {
        try {
            await draftPostsService.publishDraft(draft.id!);
            if (onPublish) {
                onPublish(draft);
            }
            await loadDrafts();
        } catch (error) {
            console.error('Failed to publish draft:', error);
            alert('Failed to publish draft');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-[var(--bg-secondary)] w-full max-w-4xl rounded-2xl p-6 border border-[var(--border-color)] shadow-2xl relative max-h-[90vh] flex flex-col">
                    <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <CloseIcon className="w-6 h-6" />
                    </button>

                    <h2 className="text-2xl font-bold mb-2">📝 Draft Posts</h2>
                    <p className="text-[var(--text-secondary)] mb-6">
                        {campaignId ? 'Campaign drafts' : 'All your draft posts'}
                    </p>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="text-center py-12 text-[var(--text-secondary)]">
                            <p className="text-4xl mb-4">📭</p>
                            <p>No drafts yet</p>
                            <p className="text-sm mt-2">Generate AI posts to create drafts</p>
                        </div>
                    ) : isEditing && selectedDraft ? (
                        <div className="flex-1 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Content
                                </label>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={12}
                                    className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] outline-none resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {drafts.map((draft) => (
                                <div
                                    key={draft.id}
                                    className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-[var(--text-primary)] mb-1">
                                                {draft.title}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                r/{draft.subreddit} • {new Date(draft.created_at!).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-3">
                                        {draft.content}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(draft)}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handlePublish(draft)}
                                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                        >
                                            📤 Publish
                                        </button>
                                        <button
                                            onClick={() => handleDelete(draft.id!)}
                                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DraftPosts;
