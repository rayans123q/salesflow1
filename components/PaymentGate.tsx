import React, { useState, useEffect } from 'react';
import { whopService } from '../services/whopService';
import { CheckIcon, CloseIcon } from '../constants';

interface PaymentGateProps {
  userId: string;
  onAccessGranted: () => void;
}

const PaymentGate: React.FC<PaymentGateProps> = ({ userId, onAccessGranted }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, [userId]);

  const checkSubscription = async () => {
    setIsChecking(true);
    try {
      const active = await whopService.hasActiveSubscription(userId);
      setHasAccess(active);
      
      if (active) {
        onAccessGranted();
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubscribe = () => {
    const checkoutUrl = whopService.getCheckoutUrl();
    window.open(checkoutUrl, '_blank');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Checking subscription...</p>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return null; // User has access, don't show gate
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Main Card */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] p-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Unlock Sales Flow</h1>
            <p className="text-white/90 text-lg">Start finding leads on autopilot</p>
          </div>

          {/* Pricing */}
          <div className="p-8 text-center border-b border-[var(--border-color)]">
            <div className="inline-block">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-5xl font-bold text-[var(--text-primary)]">$9</span>
                <span className="text-xl text-[var(--text-secondary)]">/month</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Cancel anytime</p>
            </div>
          </div>

          {/* Features */}
          <div className="p-8">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6 text-center">
              What You Get:
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {[
                'Unlimited campaign creation',
                'AI-powered lead discovery',
                'Reddit & Discord integration',
                'Smart comment generation',
                '50 campaign refreshes/month',
                '250 AI responses/month',
                'Real-time lead notifications',
                'Priority support',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-[var(--text-primary)]">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-bold py-4 px-8 rounded-xl text-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              Subscribe Now - $9/month
            </button>

            <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
              Secure payment processing
            </p>
          </div>

          {/* Footer */}
          <div className="bg-[var(--bg-tertiary)] p-6 text-center border-t border-[var(--border-color)]">
            <p className="text-sm text-[var(--text-secondary)]">
              Already subscribed?{' '}
              <button
                onClick={checkSubscription}
                className="text-[var(--brand-primary)] hover:underline font-medium"
              >
                Refresh to verify
              </button>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-6 text-[var(--text-secondary)] text-sm">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-500" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-500" />
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGate;
