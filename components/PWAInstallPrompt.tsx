import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
      return;
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    // Listen for custom install button click from landing page
    const handleCustomInstallClick = () => {
      handleInstallClick();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-click', handleCustomInstallClick);

    // For iOS, show install button if not installed
    if (iOS && !window.navigator.standalone) {
      setShowInstallButton(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-click', handleCustomInstallClick);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (!showInstallButton) return null;

  return (
    <>
      {/* Install Button */}
      <button
        onClick={handleInstallClick}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-semibold"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Install App
      </button>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 max-w-md w-full border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Install SalesFlow</h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-[var(--text-secondary)]">
              <p className="font-semibold text-[var(--text-primary)]">To install on iOS:</p>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 rounded-lg p-2 mt-1">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.18l6 3.75v7.14l-6 3.75-6-3.75V7.93l6-3.75z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">1. Tap the Share button</p>
                  <p className="text-sm">Look for the share icon at the bottom of Safari</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 rounded-lg p-2 mt-1">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">2. Select "Add to Home Screen"</p>
                  <p className="text-sm">Scroll down in the share menu to find this option</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 rounded-lg p-2 mt-1">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">3. Tap "Add"</p>
                  <p className="text-sm">The app will appear on your home screen</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
