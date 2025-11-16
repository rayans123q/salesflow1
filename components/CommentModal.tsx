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
    const overlayRef = React.useRef<HTMLDivElement>(null);

    // Lock body scroll when modal opens
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

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
        <div ref={overlayRef} className="fixed inset-0 bg-black/70 z-30 overflow-y-auto" onClick={onClose}>
            <div className="min-h-screen flex items-start sm:items-center justify-center p-2 sm:p-4 py-4 sm:py-8">
                <div className="bg-[var(--bg-secondary)] w-full max-w-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-[var(--border-color)] shadow-2xl relative my-auto max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors z-10">
                    <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[var(--text-primary)] pr-8">Engage with Post</h2>

                <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-1">
                    <div className="bg-[var(--bg-tertiary)] p-3 sm:p-4 rounded-lg max-h-28 sm:max-h-32 md:max-h-48 overflow-y-auto">
                        <p className="text-xs sm:text-sm text-violet-400 font-semibold">{post.sourceName}</p>
                        <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)] mb-1 sm:mb-2">{post.title}</h3>
                        <p className="text-[var(--text-secondary)] text-xs sm:text-sm whitespace-pre-wrap">{post.content}</p>
                    </div>
                    
                    <div>
                        <label htmlFor="comment" className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-2">Generated Comment</label>
                        <textarea
                            id="comment"
                            rows={4}
                            className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg p-3 sm:p-4 text-sm sm:text-base text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none resize-none"
                            placeholder="Click 'Write with AI' to generate a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        ></textarea>
                    </div>

                    {history && history.length > 0 && (
                        <div>
                            <button
                                onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                                className="text-xs sm:text-sm text-violet-400 hover:underline flex items-center gap-1 transition-colors"
                                aria-expanded={isHistoryVisible}
                            >
                                {isHistoryVisible ? 'Hide' : 'Show'} Comment History ({history.length})
                                <ChevronDownIcon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isHistoryVisible ? 'rotate-180' : ''}`} />
                            </button>
                            {isHistoryVisible && (
                                <div className="mt-2 border border-gray-700 bg-[var(--bg-tertiary)] rounded-lg max-h-32 sm:max-h-36 overflow-y-auto animate-fade-in stagger-in">
                                    {history.map((comment, index) => (
                                        <div
                                            key={index}
                                            style={{ animationDelay: `${index * 50}ms` }}
                                            className="p-2 sm:p-3 text-xs sm:text-sm text-[var(--text-secondary)] hover:bg-violet-500/10 hover:text-[var(--text-primary)] cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors"
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
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-4 sm:mt-6 border-t border-[var(--border-color)] pt-4 sm:pt-6">
                     <button 
                        onClick={onOpenAi}
                        className="bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-black/30 dark:hover:bg-white/20 transition-colors w-full sm:w-auto text-sm sm:text-base"
                    >
                        Write with AI
                    </button>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                        <button 
                            onClick={handleCopy}
                            className={`font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center sm:w-44 text-sm sm:text-base ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                            disabled={!commentText || copied}
                        >
                            {copied ? (
                                <>
                                    <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Copied!
                                </>
                            ) : (
                                'Copy Comment'
                            )}
                        </button>
                         <button 
                            onClick={handleViewOnPlatform}
                            className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-md hover:opacity-90 transition-opacity text-sm sm:text-base"
                        >
                            View on {post.source === 'reddit' ? 'Reddit' : 'Discord'}
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default CommentModal;
