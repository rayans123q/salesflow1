import React, { useState } from 'react';
import { CloseIcon } from '../constants';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (name: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [name, setName] = useState('');
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onLogin(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] w-full max-w-md rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-2 text-center text-[var(--text-primary)]">Welcome to Sales Flow</h2>
                <p className="text-[var(--text-secondary)] text-center mb-8">Enter your name to get started.</p>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Your Name</label>
                            <input
                                id="username"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Jane Doe"
                                className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold py-3 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
