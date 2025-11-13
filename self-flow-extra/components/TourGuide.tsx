import React, { useEffect, useState } from 'react';

interface TourGuideProps {
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const tourSteps = [
  {
    title: 'Welcome to self-flow extra!',
    content: "Let's quickly walk through how to find and connect with your next prospects.",
    targetId: null, // Centered modal
  },
  {
    title: '1. Start Your Search',
    content: 'Type a software component, service, or technology here. For example, "Stripe payment gateway" or "React date picker". Then press Enter or the search icon.',
    targetId: 'tour-search-bar',
  },
  {
    title: '2. Get Search Ideas',
    content: "Unsure what to search for? Click here to generate relevant keywords based on your own website or business description.",
    targetId: 'tour-generate-ideas',
  },
  {
    title: '3. Use Your Voice',
    content: 'You can also click the microphone to start a search with your voice.',
    targetId: 'tour-voice-search',
  },
  {
    title: '4. Quick Access',
    content: 'Your recent searches will appear here. Click one to search again, or use the "x" to remove it from your history.',
    targetId: 'tour-recent-searches',
  },
  {
    title: '5. Describe Your Offer',
    content: 'Enter your product or service description here. This is crucial for generating personalized outreach messages later.',
    targetId: 'tour-user-offer',
  },
  {
    title: '6. View & Scrape Results',
    content: 'A list of companies will appear in this section after your search. From there, you can filter them or click "Find Contacts" to start scraping.',
    targetId: 'tour-results-section',
  },
  {
    title: '7. Generate Outreach',
    content: 'Once scraping is complete, click on any person in the results table. This will open an assistant to generate a custom email or social media message for you, based on your offer.',
    targetId: 'tour-scraped-data-section',
  },
   {
    title: "You're all set!",
    content: 'You now know how to use self-flow extra. Start your first search to find new prospects!',
    targetId: null, // Centered modal
  },
];

const TourGuide: React.FC<TourGuideProps> = ({ step, onNext, onPrev, onSkip }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = tourSteps[step];

  useEffect(() => {
    if (step >= tourSteps.length) {
      onSkip(); // End tour if step is out of bounds
      return;
    }
    const currentStepConfig = tourSteps[step];
    if (currentStepConfig.targetId) {
      const element = document.getElementById(currentStepConfig.targetId);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null); // Reset for centered steps
    }
  }, [step, onSkip]);
  
  if (!currentStep) {
    return null;
  }


  const popoverStyle: React.CSSProperties = {
    transition: 'all 0.3s ease-in-out',
    zIndex: 100,
  };
  
  if (targetRect && targetRect.width > 0) {
    popoverStyle.position = 'absolute';
    const top = targetRect.bottom + 10;
    const left = targetRect.left + (targetRect.width / 2) - 150; // Center popover under target
    popoverStyle.top = `${Math.min(top, window.innerHeight - 150)}px`;
    popoverStyle.left = `${Math.max(10, Math.min(left, window.innerWidth - 310))}px`; // Keep in viewport
    popoverStyle.width = '300px';
  } else {
    // Center it for welcome/end screens
    popoverStyle.position = 'fixed';
    popoverStyle.top = '50%';
    popoverStyle.left = '50%';
    popoverStyle.transform = 'translate(-50%, -50%)';
    popoverStyle.width = '90%';
    popoverStyle.maxWidth = '400px';
  }

  const handleNext = () => {
    if (step === tourSteps.length - 1) {
      onSkip();
    } else {
      onNext();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 transition-opacity duration-300">
      {targetRect && targetRect.width > 0 && (
        <div
          className="absolute border-2 border-cyan-400 border-dashed rounded-lg shadow-2xl shadow-cyan-500/50 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            transition: 'all 0.3s ease-in-out',
          }}
        />
      )}
      <div
        className="bg-gray-800 rounded-lg p-6 text-white border border-gray-700 shadow-xl"
        style={popoverStyle}
        role="dialog"
        aria-labelledby="tour-title"
      >
        <h3 id="tour-title" className="text-xl font-bold text-cyan-300 mb-2">{currentStep.title}</h3>
        <p className="text-gray-300 mb-4">{currentStep.content}</p>
        <div className="flex justify-between items-center">
          <button onClick={onSkip} className="text-sm text-gray-400 hover:text-white">
            Skip Tour
          </button>
          <div className="flex gap-2">
            {step > 0 && step < tourSteps.length - 1 && (
              <button
                onClick={onPrev}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              {step === tourSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 mt-4">
            Step {step + 1} of {tourSteps.length}
        </div>
      </div>
    </div>
  );
};

export default TourGuide;