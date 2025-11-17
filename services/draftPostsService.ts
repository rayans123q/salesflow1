// Draft Posts Service
// Manages AI-generated post drafts

import { supabase } from './supabaseClient';

export interface DraftPost {
    id?: number;
    user_id: string;
    campaign_id?: number;
    subreddit: string;
    title: string;
    content: string;
    post_type: 'text' | 'link' | 'image';
    created_at?: string;
    updated_at?: string;
    published_at?: string;
    is_published: boolean;
}

class DraftPostsService {
    /**
     * Save a new draft post
     */
    async saveDraft(draft: Omit<DraftPost, 'id' | 'created_at' | 'updated_at'>): Promise<DraftPost> {
        console.log('💾 Saving draft post...');
        
        const { data, error } = await supabase
            .from('post_drafts')
            .insert(draft)
            .select()
            .single();

        if (error) {
            console.error('❌ Failed to save draft:', error);
            throw error;
        }

        console.log('✅ Draft saved successfully');
        return data;
    }

    /**
     * Get all drafts for a user
     */
    async getUserDrafts(userId: string): Promise<DraftPost[]> {
        const { data, error } = await supabase
            .from('post_drafts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_published', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Failed to fetch drafts:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get drafts for a specific campaign
     */
    async getCampaignDrafts(userId: string, campaignId: number): Promise<DraftPost[]> {
        const { data, error } = await supabase
            .from('post_drafts')
            .select('*')
            .eq('user_id', userId)
            .eq('campaign_id', campaignId)
            .eq('is_published', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Failed to fetch campaign drafts:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Update a draft
     */
    async updateDraft(draftId: number, updates: Partial<DraftPost>): Promise<DraftPost> {
        console.log('📝 Updating draft...');
        
        const { data, error } = await supabase
            .from('post_drafts')
            .update(updates)
            .eq('id', draftId)
            .select()
            .single();

        if (error) {
            console.error('❌ Failed to update draft:', error);
            throw error;
        }

        console.log('✅ Draft updated successfully');
        return data;
    }

    /**
     * Delete a draft
     */
    async deleteDraft(draftId: number): Promise<void> {
        console.log('🗑️ Deleting draft...');
        
        const { error } = await supabase
            .from('post_drafts')
            .delete()
            .eq('id', draftId);

        if (error) {
            console.error('❌ Failed to delete draft:', error);
            throw error;
        }

        console.log('✅ Draft deleted successfully');
    }

    /**
     * Mark draft as published
     */
    async publishDraft(draftId: number): Promise<DraftPost> {
        console.log('📤 Publishing draft...');
        
        const { data, error } = await supabase
            .from('post_drafts')
            .update({
                is_published: true,
                published_at: new Date().toISOString()
            })
            .eq('id', draftId)
            .select()
            .single();

        if (error) {
            console.error('❌ Failed to publish draft:', error);
            throw error;
        }

        console.log('✅ Draft published successfully');
        return data;
    }

    /**
     * Get draft count for a user
     */
    async getDraftCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('post_drafts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_published', false);

        if (error) {
            console.error('❌ Failed to get draft count:', error);
            return 0;
        }

        return count || 0;
    }
}

export const draftPostsService = new DraftPostsService();
