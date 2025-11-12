
import React, { useState, useEffect } from 'react';
import { CheckIcon } from '../constants';
import { Campaign } from '../types';

interface FindingLeadsProps {
    campaignData: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'> | null;
}

const FindingLeads: React.FC<FindingLeadsProps> = ({ campaignData }) => {
    const [progress, setProgress] = useState<number>(0);

    const sources = campaignData?.leadSources || [];
    const platformText = sources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' & ');

    const steps: string[] = [];
    if (sources.includes('reddit')) {
        steps.push(`Searching for live posts on Reddit...`);
    }
    if (sources.includes('discord')) {
        steps.push(`Searching public messages on Discord...`);
    }
    steps.push('Analyzing and scoring potential leads...');
    steps.push('Finalizing results...');
    
    useEffect(() => {
        const timers = steps.map((_, index) => 
            setTimeout(() => {
                setProgress(index + 1);
            }, (index + 1) * 1500)
        );
        return () => timers.forEach(clearTimeout);
    }, [steps.length]);

    if (!campaignData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                    <div 
                        className="absolute inset-0 rounded-full border-4 border-[var(--brand-primary)] border-t-transparent animate-spin"
                        style={{ animationDuration: '1.5s' }}
                    ></div>
                </div>
                <h1 className="text-4xl font-bold mb-4">Preparing search...</h1>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                <div 
                    className="absolute inset-0 rounded-full border-4 border-[var(--brand-primary)] border-t-transparent animate-spin"
                    style={{ animationDuration: '1.5s' }}
                ></div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Finding Leads on {platformText}</h1>
            <p className="text-[var(--text-secondary)] max-w-md mb-12">
                Our AI is searching through millions of public posts and messages to find potential customers who need your solution.
            </p>

            <div className="w-full max-w-md space-y-4">
                {steps.map((step, index) => (
                    <div
                        key={step}
                        className={`flex items-center w-full bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)] transition-all duration-300 ${
                            progress > index ? 'border-green-500/50' : ''
                        }`}
                    >
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center mr-4 transition-colors duration-300 ${
                                progress > index ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                            }`}
                        >
                            {progress > index ? <CheckIcon className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-gray-500"></div>}
                        </div>
                        <span className={`transition-colors duration-300 ${progress > index ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{step}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FindingLeads;
