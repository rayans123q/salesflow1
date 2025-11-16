import React, { useState } from 'react';
import { CheckIcon, SparkleIcon } from '../constants';
import { supabase } from '../services/supabaseClient';

const ThankYouPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [hasValidToken, setHasValidToken] = useState(false);

    // Check for verification token on mount
    React.useEffect(() => {
        const checkToken = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            const membershipId = urlParams.get('membership_id');

            // If no token, this is an unauthorized access attempt
            if (!token && !membershipId) {
                console.warn('⚠️ No verification token - unauthorized access attempt');
                setError('Invalid access. Please complete payment through the checkout page.');
                setVerifying(false);
                setHasValidToken(false);
                
                // Redirect to home after 3 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
                return;
            }

            // If we have a membership ID from Whop redirect, verify it
            if (membershipId) {
                try {
                    // Call backend to verify the membership
                    const response = await fetch('/.netlify/functions/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ membershipId })
                    });

                    const data = await response.json();
                    
                    if (data.verified) {
                        setHasValidToken(true);
                        setEmail(data.email || '');
                    } else {
                        setError('Payment verification failed. Please contact support.');
                        setHasValidToken(false);
                    }
                } catch (err) {
                    console.error('Verification error:', err);
                    setError('Failed to verify payment. Please contact support.');
                    setHasValidToken(false);
                }
            } else {
                // Legacy token-based verification
                setHasValidToken(true);
            }
            
            setVerifying(false);
        };

        checkToken();
    }, []);

    const handleActivateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Verify payment before activating
            const urlParams = new URLSearchParams(window.location.search);
            const membershipId = urlParams.get('membership_id');

            if (!membershipId) {
                throw new Error('No membership ID found');
            }

            // Call backend to activate subscription
            const response = await fetch('/.netlify/functions/activate-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email.toLowerCase().trim(),
                    membershipId 
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to activate subscription');
            }

            setSuccess(true);
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } catch (err) {
            console.error('Error activating subscription:', err);
            setError(err instanceof Error ? err.message : 'Failed to activate subscription. Please contact support.');
            setLoading(false);
        }
    };

    // Show loading while verifying token
    if (verifying) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center border border-white/20 shadow-2xl">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Verifying Payment...
                    </h1>
                    <p className="text-gray-200">
                        Please wait while we confirm your subscription
                    </p>
                </div>
            </div>
        );
    }

    // Show error if no valid token
    if (!hasValidToken) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center border border-white/20 shadow-2xl">
                    <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Access Denied
                    </h1>
                    <p className="text-gray-200 mb-6">
                        {error || 'This page can only be accessed after completing payment.'}
                    </p>
                    <p className="text-sm text-gray-300">
                        Redirecting to home page...
                    </p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center border border-white/20 shadow-2xl">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckIcon className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Subscription Activated! 🎉
                    </h1>
                    <p className="text-gray-200 mb-6">
                        Redirecting you to the dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <SparkleIcon className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Thank You for Your Purchase! 🎉
                    </h1>
                    <p className="text-gray-200">
                        One more step to activate your subscription
                    </p>
                </div>

                <form onSubmit={handleActivateSubscription} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                            Enter your email to activate
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-gray-300 mt-2">
                            Use the same email you'll sign in with
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-violet-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? 'Activating...' : 'Activate Subscription'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-300">
                    <p>Need help? Contact support@salesflow.com</p>
                </div>
            </div>
        </div>
    );
};

export default ThankYouPage;
