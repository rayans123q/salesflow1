import React, { useState } from 'react';
import { CloseIcon } from '../constants';
import { supabase } from '../services/supabaseClient';
import { whopService } from '../services/whopService';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: { id: string; email: string; name: string }) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(true); // Default to sign-up mode
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    
    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        try {
            if (isSignUp) {
                // Sign up
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: name.trim() || email.split('@')[0], // Use name from form or email username
                        },
                        emailRedirectTo: `${window.location.origin}`,
                    },
                });

                if (signUpError) {
                    setError(signUpError.message);
                    setLoading(false);
                    return;
                }

                if (data.user) {
                    // Check if email confirmation is required
                    if (data.user.email_confirmed_at) {
                        // User is immediately confirmed - grant access (no payment required)
                        console.log('✅ Sign up successful, granting access...');
                        // Clear loading state immediately
                        setLoading(false);
                        try {
                            onLogin({
                                id: data.user.id,
                                email: data.user.email!,
                                name: data.user.user_metadata?.name || name.trim() || data.user.email!.split('@')[0],
                            });
                        } catch (loginError) {
                            console.error('❌ onLogin callback error:', loginError);
                            // Don't show error to user, auth was successful
                        }
                    } else {
                        // Email confirmation required
                        setMessage('Please check your email to confirm your account before signing in.');
                        setLoading(false);
                        setIsSignUp(false); // Switch to sign in mode
                    }
                }
            } else {
                // Sign in
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) {
                    setError(signInError.message);
                    setLoading(false);
                    return;
                }

                if (data.user) {
                    console.log('✅ Sign in successful, calling onLogin callback');
                    // Clear loading state immediately to prevent freezing
                    setLoading(false);
                    // Auth successful - the onAuthStateChange listener will handle the rest
                    // Just call onLogin to close modal and show success
                    try {
                        onLogin({
                            id: data.user.id,
                            email: data.user.email!,
                            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
                        });
                        console.log('✅ onLogin callback completed');
                    } catch (loginError) {
                        console.error('❌ onLogin callback error:', loginError);
                        // Don't show error to user, auth was successful
                    }
                }
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
            console.error('Auth error:', err);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError('Please enter your email address first.');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) {
                setError(resetError.message);
            } else {
                setMessage('Password reset email sent! Please check your inbox.');
            }
        } catch (err) {
            setError('Failed to send password reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setLoading(true);

        try {
            console.log('🔵 Initiating Google OAuth sign-in...');
            console.log('🔗 Redirect URL:', window.location.origin);
            
            const { data, error: signInError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            
            console.log('📤 OAuth response:', { data, error: signInError });

            if (signInError) {
                console.error('❌ Google OAuth error:', signInError);
                setError(signInError.message);
                setLoading(false);
                return;
            }

            console.log('✅ Google OAuth initiated, redirecting...');
            // User will be redirected to Google, then back to app
            // The onAuthStateChange listener will handle the rest
        } catch (err) {
            console.error('❌ Google sign-in error:', err);
            setError('Failed to sign in with Google. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] w-full max-w-md rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-2 text-center text-[var(--text-primary)]">
                    {isSignUp ? 'Create Account' : 'Welcome to Sales Flow'}
                </h2>
                <p className="text-[var(--text-secondary)] text-center mb-8">
                    {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
                </p>

                {message && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {isSignUp && (
                        <div>
                                <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Your Name
                                </label>
                            <input
                                    id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Jane Doe"
                                    className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none"
                                    autoFocus={isSignUp}
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                                className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none"
                                autoFocus={!isSignUp}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
                                required
                                minLength={6}
                                className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none"
                            />
                        </div>
                        {!isSignUp && (
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                className="text-sm text-[var(--brand-primary)] hover:underline w-full text-right"
                            >
                                Forgot password?
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !email || !password || (isSignUp && password.length < 6)}
                            className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold py-3 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[var(--bg-secondary)] text-[var(--text-secondary)]">Or continue with</span>
                    </div>
                </div>

                {/* Google OAuth Button */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-lg border border-gray-300 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                </button>

                <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                    {isSignUp ? (
                        <>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(false);
                                    setError(null);
                                    setMessage(null);
                                }}
                                className="text-[var(--brand-primary)] hover:underline font-medium"
                            >
                                Sign in
                            </button>
                        </>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(true);
                                    setError(null);
                                    setMessage(null);
                                }}
                                className="text-[var(--brand-primary)] hover:underline font-medium"
                            >
                                Sign up
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
