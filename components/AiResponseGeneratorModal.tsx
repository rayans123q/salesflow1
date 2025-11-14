import React, { useState } from 'react';
import { Campaign, AIStyleSettings, Tone, SalesApproach, ResponseLength } from '../types';
import { CloseIcon, SparkleIcon } from '../constants';

interface AiResponseGeneratorModalProps {
    campaign: Campaign;
    onClose: () => void;
    onGeneratePreview: (settings: AIStyleSettings) => void;
    onUseComment: (comment: string) => void;
    preview: string;
    isGenerating: boolean;
    savedAiStyle: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>;
    onSaveStyle: (style: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>) => void;
}

const StyleButton: React.FC<{ label: string; description: string; selected: boolean; onClick: () => void, emoji: string }> = ({ label, description, selected, onClick, emoji }) => (
    <button
        onClick={onClick}
        className={`text-left p-4 rounded-lg border-2 w-full transition-all duration-200 ${selected ? 'border-[var(--brand-primary)] bg-violet-500/10' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-gray-500'}`}
    >
        <p className="text-2xl mb-1">{emoji}</p>
        <p className={`font-semibold ${selected ? 'text-[var(--text-primary)]' : 'text-gray-300'}`}>{label}</p>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </button>
);

const LengthButton: React.FC<{ label: string; description: string; selected: boolean; onClick: () => void }> = ({ label, description, selected, onClick }) => (
     <button
        onClick={onClick}
        className={`text-center p-4 rounded-lg border-2 w-full transition-all duration-200 ${selected ? 'border-[var(--brand-primary)] bg-violet-500/10' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-gray-500'}`}
    >
        <p className={`font-semibold ${selected ? 'text-[var(--text-primary)]' : 'text-gray-300'}`}>{label}</p>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </button>
);


const AiResponseGeneratorModal: React.FC<AiResponseGeneratorModalProps> = ({ campaign, onClose, onGeneratePreview, onUseComment, preview, isGenerating, savedAiStyle, onSaveStyle }) => {
    const [tone, setTone] = useState<Tone>(savedAiStyle.tone);
    const [salesApproach, setSalesApproach] = useState<SalesApproach>(savedAiStyle.salesApproach);
    const [length, setLength] = useState<ResponseLength>(savedAiStyle.length);
    const [customOffer, setCustomOffer] = useState(campaign.description);
    const [includeWebsiteLink, setIncludeWebsiteLink] = useState(savedAiStyle.includeWebsiteLink);
    const [saveStyle, setSaveStyle] = useState(false);
    
    // Scroll to top and lock body scroll when modal opens
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);
    
    const salesApproachValues: SalesApproach[] = ['Subtle', 'Moderate', 'Direct', 'Aggressive'];
    const salesApproachIndex = salesApproachValues.indexOf(salesApproach);

    const handleGenerate = () => {
        const currentSettings = { tone, salesApproach, length, customOffer, includeWebsiteLink, saveStyle };
        if (saveStyle) {
            // We don't save customOffer or the saveStyle preference itself
            const { customOffer: _co, saveStyle: _ss, ...styleToSave } = currentSettings;
            onSaveStyle(styleToSave);
        }
        onGeneratePreview(currentSettings);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] shadow-2xl relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors z-10">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold mb-6 text-center">🤖 AI Response Generator</h2>
                
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
                    {/* Tone */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Response Style (Tone)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <StyleButton label="Friendly & Warm" description="Approachable and helpful" selected={tone==='Friendly & Warm'} onClick={() => setTone('Friendly & Warm')} emoji="😊"/>
                            <StyleButton label="Professional" description="Formal and business-like" selected={tone==='Professional'} onClick={() => setTone('Professional')} emoji="👔"/>
                            <StyleButton label="Casual & Relaxed" description="Easy-going and informal" selected={tone==='Casual & Relaxed'} onClick={() => setTone('Casual & Relaxed')} emoji="😎"/>
                            <StyleButton label="Expert & Authoritative" description="Knowledgeable and confident" selected={tone==='Expert & Authoritative'} onClick={() => setTone('Expert & Authoritative')} emoji="🧐"/>
                        </div>
                    </div>

                    {/* Sales Approach */}
                    <div>
                         <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Sales Approach</label>
                         <input type="range" min="0" max="3" value={salesApproachIndex} 
                            onChange={(e) => setSalesApproach(salesApproachValues[parseInt(e.target.value)])}
                            className="w-full"
                         />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            {salesApproachValues.map(val => <span key={val}>{val}</span>)}
                        </div>
                    </div>
                    
                     {/* Response Length */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Response Length</label>
                        <div className="grid grid-cols-3 gap-3">
                            <LengthButton label="Short" description="1-2 sentences" selected={length === 'Short'} onClick={() => setLength('Short')} />
                            <LengthButton label="Medium" description="2-4 sentences" selected={length === 'Medium'} onClick={() => setLength('Medium')} />
                            <LengthButton label="Long" description="5+ sentences" selected={length === 'Long'} onClick={() => setLength('Long')} />
                        </div>
                    </div>
                    
                    {/* Custom Offer */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Specific Angle / Offer</label>
                        <textarea 
                            value={customOffer} 
                            onChange={(e) => setCustomOffer(e.target.value)} 
                            rows={3} 
                            className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] outline-none resize-none text-sm"
                            placeholder="e.g., Mention our free trial, focus on the time-saving feature, or offer a discount code."
                        />
                    </div>

                    {/* Style Settings */}
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Style Settings</label>
                        <div className="space-y-3">
                            <div>
                                <label className="flex items-center bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-color)] cursor-pointer">
                                    <input type="checkbox" checked={includeWebsiteLink} onChange={(e) => setIncludeWebsiteLink(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-violet-500 focus:ring-violet-500"/>
                                    <span className="ml-3 text-sm text-[var(--text-primary)]">Include Website Link</span>
                                </label>
                                {campaign.websiteUrl && includeWebsiteLink && (
                                    <div className="pl-4 pt-2">
                                        <a href={campaign.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:underline truncate block">
                                            Will link to: {campaign.websiteUrl}
                                        </a>
                                    </div>
                                )}
                            </div>
                            <label className="flex items-center bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-color)] cursor-pointer">
                                <input type="checkbox" checked={saveStyle} onChange={(e) => setSaveStyle(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-violet-500 focus:ring-violet-500"/>
                                <span className="ml-3 text-sm text-[var(--text-primary)]">Save Style for future responses</span>
                            </label>
                        </div>
                    </div>

                    {(isGenerating || preview) && (
                        <div className="space-y-2 animate-fade-in">
                            <label className="block text-sm font-medium text-[var(--text-secondary)]">Preview</label>
                            <div className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg p-4 text-[var(--text-primary)] text-sm min-h-[120px] whitespace-pre-wrap">
                                {isGenerating ? (
                                    <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Generating...
                                    </div>
                                ) : (
                                    preview
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-6 pt-6 border-t border-[var(--border-color)]">
                     {preview && !isGenerating ? (
                        <>
                             <button onClick={handleGenerate} className="flex items-center justify-center gap-2 bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-5 py-2.5 rounded-lg hover:bg-black/30 dark:hover:bg-white/20 transition-colors w-full sm:w-auto">
                                <SparkleIcon className="w-4 h-4" />
                                Regenerate
                            </button>
                            <button onClick={() => onUseComment(preview)} className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-opacity w-full sm:w-auto">
                                Use this Comment
                            </button>
                        </>
                    ) : (
                         <button 
                            onClick={handleGenerate} 
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            {isGenerating ? (
                                <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generating...
                                </>
                            ): (
                                'Generate Preview'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiResponseGeneratorModal;