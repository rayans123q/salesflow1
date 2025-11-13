import React, { useState } from 'react';
import { CloseIcon } from '../constants';
import { supabase } from '../services/supabaseClient';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: { id: string; email: string; name: string }) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(false);
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
                        // User is immediately confirmed - just log them in
                        const userData = {
                            id: data.user.id,
                            email: data.user.email!,
                            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
                        };
                        onLogin(userData);
                        setLoading(false);
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
                    // Try to get user data from our users table
                    try {
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .select('id, name, email')
                            .eq('id', data.user.id)
                            .single();

                        if (userError && userError.code === 'PGRST116') {
                            // User doesn't exist in our table yet, create it
                            try {
                                const { data: newUser, error: createError } = await supabase
                                    .from('users')
                                    .insert([{
                                        id: data.user.id,
                                        name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
                                        email: data.user.email,
                                    }])
                                    .select()
                                    .single();

                                if (createError) {
                                    console.error('Failed to create user in DB:', createError);
                                    // Still log them in with auth data
                                    onLogin({
                                        id: data.user.id,
                                        email: data.user.email!,
                                        name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
                                    });
                                } else {
                                    onLogin({
                                        id: newUser.id,
                                        email: newUser.email,
                                        name: newUser.name,
                                    });
                                }
                            } catch (createErr) {
                                console.error('Error creating user:', createErr);
                                // Still log them in with auth data
                                onLogin({
                                    id: data.user.id,
                                    email: data.user.email!,
                                    name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
                                });
                            }
                        } else if (userData) {
                            onLogin({
                                id: userData.id,
                                email: userData.email || data.user.email!,
                                name: userData.name,
                            });
                        } else {
                            // Fallback to auth data
                            onLogin({
                                id: data.user.id,
                                email: data.user.email!,
                                name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
                            });
                        }
                    } catch (err) {
                        console.error('Error fetching user data:', err);
                        // Fallback to auth data
                        onLogin({
                            id: data.user.id,
                            email: data.user.email!,
                            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
                        });
                    }
                    setLoading(false);
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
                        <div className="text-center text-sm text-[var(--text-secondary)]">
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
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
