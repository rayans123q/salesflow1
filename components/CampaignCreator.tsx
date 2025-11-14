
import React, { useState } from 'react';
import { Campaign, CampaignDateRange, LeadSource } from '../types';
import { CloseIcon, RedditIcon, SearchIcon, SparkleIcon, TwitterIcon } from '../constants';
import { generateCampaignDetailsFromUrl } from '../services/geminiService';

interface CampaignCreatorProps {
    onBack: () => void;
    onCreate: (campaignData: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>) => void;
}

const StepIndicator: React.FC<{ step: number, currentStep: number, label: string }> = ({ step, currentStep, label }) => {
    const isActive = step === currentStep;
    const isCompleted = step < currentStep;

    return (
        <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : isCompleted ? 'border-[var(--success)] bg-[var(--success)] text-white' : 'border-gray-600 text-gray-500'}`}>
                {isCompleted ? '✓' : step}
            </div>
            <span className={`ml-3 font-medium ${isActive ? 'text-[var(--text-primary)]' : 'text-gray-500'}`}>{label}</span>
        </div>
    );
};

const CampaignCreator: React.FC<CampaignCreatorProps> = ({ onBack, onCreate }) => {
    const [step, setStep] = useState(1);
    const [campaignName, setCampaignName] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [negativeKeywords, setNegativeKeywords] = useState<string[]>([]);
    const [currentNegativeKeyword, setCurrentNegativeKeyword] = useState('');
    const [subreddits, setSubreddits] = useState<string[]>([]);
    const [currentSubreddit, setCurrentSubreddit] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [offer, setOffer] = useState('');
    const [urlForGeneration, setUrlForGeneration] = useState('');
    const [isGeneratingFromUrl, setIsGeneratingFromUrl] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<CampaignDateRange>('lastWeek');
    const [leadSources, setLeadSources] = useState<LeadSource[]>(['reddit']);

    const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentKeyword.trim()) {
            e.preventDefault();
            if (!keywords.includes(currentKeyword.trim())) {
                setKeywords([...keywords, currentKeyword.trim()]);
            }
            setCurrentKeyword('');
        }
    };

    const removeKeyword = (keywordToRemove: string) => {
        setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
    };
    
    const handleNegativeKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentNegativeKeyword.trim()) {
            e.preventDefault();
            if (!negativeKeywords.includes(currentNegativeKeyword.trim())) {
                setNegativeKeywords([...negativeKeywords, currentNegativeKeyword.trim()]);
            }
            setCurrentNegativeKeyword('');
        }
    };

    const removeNegativeKeyword = (keywordToRemove: string) => {
        setNegativeKeywords(negativeKeywords.filter(keyword => keyword !== keywordToRemove));
    };

    const handleSubredditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentSubreddit.trim()) {
            e.preventDefault();
            const cleanedSubreddit = currentSubreddit.trim().replace(/^r\//i, '');
            if (cleanedSubreddit && !subreddits.includes(cleanedSubreddit)) {
                setSubreddits([...subreddits, cleanedSubreddit]);
            }
            setCurrentSubreddit('');
        }
    };

    const removeSubreddit = (subredditToRemove: string) => {
        setSubreddits(subreddits.filter(sub => sub !== subredditToRemove));
    };
    
    const handleLeadSourceToggle = (source: LeadSource) => {
        setLeadSources(prev => 
            prev.includes(source) 
                ? prev.filter(s => s !== source) 
                : [...prev, source]
        );
    };


    const handleGenerateFromUrl = async () => {
        if (!urlForGeneration) return;
        setIsGeneratingFromUrl(true);
        setGenerationError(null);
        try {
            const result = await generateCampaignDetailsFromUrl(urlForGeneration);
            setOffer(result.description);
            // Merge new keywords with existing ones, avoiding duplicates
            setKeywords(prev => [...new Set([...prev, ...result.keywords])]);
            setSubreddits(prev => [...new Set([...prev, ...result.subreddits])]);
            setWebsiteUrl(urlForGeneration); // Also populate the website URL field
        } catch (error) {
            console.error("Failed to generate details from URL", error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate campaign details. Please enter details manually.';
            setGenerationError(errorMessage);
        } finally {
            setIsGeneratingFromUrl(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="w-full max-w-lg mx-auto bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-2xl border border-[var(--border-color)] animate-fade-in">
                        <h2 className="text-2xl font-bold text-center mb-2">What's your campaign name?</h2>
                        <p className="text-[var(--text-secondary)] text-center mb-8">Choose a descriptive name for your campaign.</p>
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="campaignName" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Campaign Name</label>
                                <input
                                    id="campaignName"
                                    type="text"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    placeholder="e.g., Project Management Tool Leads"
                                    className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!campaignName}
                                className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold py-3 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue →
                            </button>
                        </div>
                    </div>
                );
            case 2:
                 return (
                    <div className="w-full max-w-lg mx-auto bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-2xl border border-[var(--border-color)] animate-fade-in">
                        <h2 className="text-2xl font-bold text-center mb-2">Set up your campaign</h2>
                        <p className="text-[var(--text-secondary)] text-center mb-8">Describe your offer and add keywords, or generate them from a URL.</p>
                        
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="generate-url" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Generate from URL</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input id="generate-url" type="text" value={urlForGeneration} onChange={(e) => setUrlForGeneration(e.target.value)} placeholder="https://your-landing-page.com" className="flex-grow bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none" />
                                    <button onClick={handleGenerateFromUrl} disabled={isGeneratingFromUrl || !urlForGeneration} className="bg-[var(--brand-primary)] text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center w-full sm:w-36 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isGeneratingFromUrl ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <SparkleIcon className="w-4 h-4 mr-2"/>
                                                Generate
                                            </>
                                        )}
                                    </button>
                                </div>
                                {generationError && (
                                    <div className="mt-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                        {generationError}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <hr className="border-gray-600" />
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--bg-secondary)] px-2 text-sm text-[var(--text-secondary)]">OR</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Lead Sources</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleLeadSourceToggle('reddit')}
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 w-full transition-all duration-200 ${leadSources.includes('reddit') ? 'border-[var(--brand-primary)] bg-violet-500/10' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-gray-500'}`}
                                    >
                                        <RedditIcon className="w-6 h-6 text-orange-500" />
                                        <div>
                                            <p className={`font-semibold ${leadSources.includes('reddit') ? 'text-[var(--text-primary)]' : 'text-gray-300'}`}>Reddit</p>
                                            <p className="text-sm text-[var(--text-secondary)] text-left">Find posts on subreddits</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleLeadSourceToggle('twitter')}
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 w-full transition-all duration-200 ${leadSources.includes('twitter') ? 'border-[var(--brand-primary)] bg-violet-500/10' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-gray-500'}`}
                                    >
                                        <TwitterIcon className="w-6 h-6 text-sky-400" />
                                        <div>
                                            <p className={`font-semibold ${leadSources.includes('twitter') ? 'text-[var(--text-primary)]' : 'text-gray-300'}`}>X / Twitter</p>
                                            <p className="text-sm text-[var(--text-secondary)] text-left">Find tweets and replies</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                             <div>
                                <label htmlFor="keywords" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Keywords</label>
                                <input
                                    id="keywords" type="text" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)}
                                    onKeyDown={handleKeywordKeyDown} placeholder="Type Keywords and press Enter"
                                    className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none" />
                                <div className="flex flex-wrap gap-2 mt-3 min-h-[28px]">
                                    {keywords.map(kw => (
                                        <span key={kw} className="bg-violet-500/20 text-violet-300 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2">
                                            {kw}
                                            <button onClick={() => removeKeyword(kw)} className="text-violet-300 hover:text-white"><CloseIcon className="w-3 h-3"/></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label htmlFor="negative-keywords" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Negative Keywords (optional)</label>
                                <input
                                    id="negative-keywords" type="text" value={currentNegativeKeyword} onChange={(e) => setCurrentNegativeKeyword(e.target.value)}
                                    onKeyDown={handleNegativeKeywordKeyDown} placeholder="Keywords to exclude, press Enter"
                                    className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none" />
                                <div className="flex flex-wrap gap-2 mt-3 min-h-[28px]">
                                    {negativeKeywords.map(kw => (
                                        <span key={kw} className="bg-red-500/20 text-red-300 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2">
                                            {kw}
                                            <button onClick={() => removeNegativeKeyword(kw)} className="text-red-300 hover:text-white"><CloseIcon className="w-3 h-3"/></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="subreddits" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Target Subreddits (optional)</label>
                                <input
                                    id="subreddits" type="text" value={currentSubreddit} onChange={(e) => setCurrentSubreddit(e.target.value)}
                                    onKeyDown={handleSubredditKeyDown} placeholder="e.g., r/webdev (press Enter)"
                                    className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none" />
                                <div className="flex flex-wrap gap-2 mt-3 min-h-[28px]">
                                    {subreddits.map(sub => (
                                        <span key={sub} className="bg-blue-500/20 text-blue-300 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2">
                                            r/{sub}
                                            <button onClick={() => removeSubreddit(sub)} className="text-blue-300 hover:text-white"><CloseIcon className="w-3 h-3"/></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Post Date Range</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['lastDay', 'lastWeek', 'lastMonth'] as CampaignDateRange[]).map(range => (
                                        <button key={range} onClick={() => setDateRange(range)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateRange === range ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                            {range === 'lastDay' ? 'Last 24h' : range === 'lastWeek' ? 'Last Week' : 'Last Month'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="website" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Website URL (for AI responses)</label>
                                <input id="website" type="text" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourwebsite.com" className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none" />
                            </div>
                            <div>
                                <label htmlFor="offer" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Your Offer</label>
                                <textarea id="offer" value={offer} onChange={(e) => setOffer(e.target.value)} rows={4} placeholder="Describe what you offer..." className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none resize-none"></textarea>
                            </div>

                            <button
                                onClick={() => onCreate({ name: campaignName, keywords, negativeKeywords, subreddits, websiteUrl, description: offer, dateRange, leadSources })}
                                disabled={keywords.length === 0 || !offer || leadSources.length === 0}
                                className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold py-3 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <SearchIcon className="w-5 h-5" />
                                Find Leads
                            </button>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="p-4 sm:p-8">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">← Back</button>
                <h1 className="text-2xl sm:text-3xl font-bold text-center">New Campaign</h1>
                 <div className="w-16 sm:w-48"></div> {/* Spacer */}
            </div>
            <div className="flex justify-center items-center gap-4 sm:gap-8 mb-12">
                <StepIndicator step={1} currentStep={step} label="Name" />
                <div className="flex-1 h-px bg-gray-600 max-w-xs"></div>
                <StepIndicator step={2} currentStep={step} label="Setup" />
            </div>
            {renderStep()}
        </div>
    );
};

export default CampaignCreator;
