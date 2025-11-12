import React, { useState, useEffect, useLayoutEffect } from 'react';
import { OnboardingStep } from '../types';

interface OnboardingTourProps {
    onComplete: () => void;
}

const TOUR_STEPS: OnboardingStep[] = [
    {
        target: '#create-campaign-btn',
        title: 'Welcome to Sales Flow!',
        content: "Let's take a quick tour to get you started. This is the main dashboard. You can create your first campaign here.",
        position: 'bottom',
    },
    {
        target: '#sidebar-campaigns-btn',
        title: 'Manage Your Campaigns',
        content: 'All of your active and paused campaigns will be listed here for you to manage and view results.',
        position: 'right',
    },
    {
        target: '#sidebar-settings-btn',
        title: 'Configure Your Account',
        content: 'In Settings, you can change the theme, manage API keys, and set your default AI style.',
        position: 'right',
    },
    {
        target: '#create-campaign-btn',
        title: "You're Ready to Go!",
        content: "That's it! You're all set. Click '+ New Campaign' whenever you're ready to find some leads. Good luck!",
        position: 'bottom',
    },
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const currentStep = TOUR_STEPS[stepIndex];
    const isLastStep = stepIndex === TOUR_STEPS.length - 1;

    useLayoutEffect(() => {
        if (!currentStep?.target) {
            setTargetRect(null);
            return;
        }

        const updatePosition = () => {
            const element = document.querySelector(currentStep.target);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            } else {
                 setTargetRect(null);
            }
        }
        
        updatePosition();

        // Use a short delay to allow UI to render before showing the tour step
        const timer = setTimeout(() => setIsVisible(true), 150);
        
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        }

    }, [currentStep]);
    
    const goToNext = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (!isLastStep) {
                setStepIndex(stepIndex + 1);
            } else {
                onComplete();
            }
        }, 300);
    };

    const handleSkip = () => {
        setIsVisible(false);
        setTimeout(onComplete, 300);
    };
    
    const getTooltipPosition = () => {
        if (!targetRect) {
            // Center if no target
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
        const PADDING = 15;
        
        switch (currentStep.position) {
            case 'bottom':
                return { top: targetRect.bottom + PADDING, left: targetRect.left + targetRect.width / 2, transform: 'translateX(-50%)' };
            case 'right':
                 return { top: targetRect.top, left: targetRect.right + PADDING };
            case 'left':
                return { top: targetRect.top, right: window.innerWidth - targetRect.left + PADDING, left: 'auto' };
            case 'top':
                return { top: targetRect.top - PADDING, left: targetRect.left + targetRect.width / 2, transform: 'translateY(-100%) translateX(-50%)' };
            default:
                return { top: targetRect.bottom + PADDING, left: targetRect.left };
        }
    };
    
    const highlightStyle: React.CSSProperties = targetRect ? {
        width: targetRect.width + 12,
        height: targetRect.height + 12,
        top: targetRect.top - 6,
        left: targetRect.left - 6,
        opacity: isVisible ? 1 : 0,
    } : { opacity: 0 };
    
     const tooltipStyle: React.CSSProperties = {
        ...getTooltipPosition(),
        opacity: isVisible ? 1 : 0,
        transform: `${(getTooltipPosition() as any).transform || ''} ${isVisible ? 'scale(1)' : 'scale(0.95)'}`,
    };

    return (
        <>
            <div className="tour-highlight" style={highlightStyle}></div>
            <div className="tour-tooltip" style={tooltipStyle}>
                <h3 className="text-lg font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]">{currentStep?.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">{currentStep?.content}</p>
                <div className="flex justify-between items-center">
                    <button onClick={handleSkip} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        Skip Tour
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{stepIndex + 1} / {TOUR_STEPS.length}</span>
                        <button onClick={goToNext} className="bg-[var(--brand-primary)] text-white font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
                            {isLastStep ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OnboardingTour;