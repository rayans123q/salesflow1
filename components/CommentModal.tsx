import React, { useState } from 'react';
import { Post } from '../types';
import { CloseIcon, CheckIcon, ChevronDownIcon } from '../constants';

interface CommentModalProps {
    post: Post;
    onClose: () => void;
    onOpenAi: () => void;
    commentText: string;
    setCommentText: (text: string) => void;
    onPostContacted: (postId: number) => void;
    history: string[];
}

const CommentModal: React.FC<CommentModalProps> = ({ post, onClose, onOpenAi, commentText, setCommentText, onPostContacted, history }) => {
    const [copied, setCopied] = useState(false);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(commentText).then(() => {
            setCopied(true);
            onPostContacted(post.id);
            setTimeout(() => {
                onClose();
            }, 1500);
        });
    };

    const handleViewOnPlatform = () => {
        window.open(post.url, '_blank', 'noopener,noreferrer');
        onPostContacted(post.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-30 p-4" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] w-full max-w-2xl rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Engage with Post</h2>

                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg mb-6 max-h-32 sm:max-h-48 overflow-y-auto">
                    <p className="text-sm text-violet-400 font-semibold">{post.sourceName}</p>
                    <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">{post.title}</h3>
                    <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap">{post.content}</p>
                </div>
                
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Generated Comment</label>
                    <textarea
                        id="comment"
                        rows={6}
                        className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg p-4 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none resize-none"
                        placeholder="Click 'Write with AI' to generate a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    ></textarea>
                </div>

                {history && history.length > 0 && (
                    <div className="mt-4">
                        <button
                            onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                            className="text-sm text-violet-400 hover:underline flex items-center gap-1 transition-colors"
                            aria-expanded={isHistoryVisible}
                        >
                            {isHistoryVisible ? 'Hide' : 'Show'} Comment History ({history.length})
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isHistoryVisible ? 'rotate-180' : ''}`} />
                        </button>
                        {isHistoryVisible && (
                            <div className="mt-2 border border-gray-700 bg-[var(--bg-tertiary)] rounded-lg max-h-36 overflow-y-auto animate-fade-in stagger-in">
                                {history.map((comment, index) => (
                                    <div
                                        key={index}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        className="p-3 text-sm text-[var(--text-secondary)] hover:bg-violet-500/10 hover:text-[var(--text-primary)] cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors"
                                        onClick={() => setCommentText(comment)}
                                        title="Use this comment"
                                    >
                                        <p className="line-clamp-2">{comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mt-6 border-t border-[var(--border-color)] pt-6">
                     <button 
                        onClick={onOpenAi}
                        className="bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-6 py-3 rounded-lg hover:bg-black/30 dark:hover:bg-white/20 transition-colors w-full sm:w-auto"
                    >
                        Write with AI
                    </button>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button 
                            onClick={handleCopy}
                            className={`font-semibold px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center sm:w-44 ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                            disabled={!commentText || copied}
                        >
                            {copied ? (
                                <>
                                    <CheckIcon className="w-5 h-5 mr-2" /> Copied!
                                </>
                            ) : (
                                'Copy Comment'
                            )}
                        </button>
                         <button 
                            onClick={handleViewOnPlatform}
                            className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition-opacity"
                        >
                            View on {post.source === 'reddit' ? 'Reddit' : 'Discord'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentModal;
