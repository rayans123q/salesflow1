import React, { useState } from 'react';
import { CheckIcon, SparkleIcon } from '../constants';
import { supabase } from '../services/supabaseClient';

const ThankYouPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleActivateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Add email to subscribed_users table
            const { error: insertError } = await supabase
                .from('subscribed_users')
                .insert({
                    email: email.toLowerCase().trim(),
                    subscribed_at: new Date().toISOString(),
                    status: 'active'
                });

            if (insertError) {
                // If already exists, update it
                if (insertError.code === '23505') {
                    const { error: updateError } = await supabase
                        .from('subscribed_users')
                        .update({ 
                            status: 'active',
                            subscribed_at: new Date().toISOString()
                        })
                        .eq('email', email.toLowerCase().trim());
                    
                    if (updateError) throw updateError;
                } else {
                    throw insertError;
                }
            }

            setSuccess(true);
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } catch (err) {
            console.error('Error activating subscription:', err);
            setError('Failed to activate subscription. Please try again or contact support.');
            setLoading(false);
        }
    };

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
