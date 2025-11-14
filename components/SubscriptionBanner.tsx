import React from 'react';
import { LockIcon, CloseIcon } from '../constants';

interface SubscriptionBannerProps {
    onUpgrade: () => void;
    onDismiss: () => void;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ onUpgrade, onDismiss }) => {
    return (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <LockIcon className="w-4 h-4 text-amber-400" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-100">
                                <span className="hidden sm:inline">You're on the free plan. </span>
                                <span className="font-semibold">Upgrade to unlock all features</span>
                            </p>
                            <p className="text-xs text-amber-200/80 hidden md:block mt-0.5">
                                View posts on Reddit/Twitter and generate AI comments with a subscription
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={onUpgrade}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow-lg transition-all duration-200 whitespace-nowrap"
                        >
                            Upgrade Now
                        </button>
                        <button
                            onClick={onDismiss}
                            className="text-amber-300 hover:text-amber-100 transition-colors p-1"
                            aria-label="Dismiss banner"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionBanner;
