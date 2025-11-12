import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonText?: string;
    confirmButtonVariant?: 'danger' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmButtonText = 'Confirm', confirmButtonVariant = 'danger' }) => {
    if (!isOpen) return null;

    const confirmButtonClasses = confirmButtonVariant === 'primary'
        ? 'bg-blue-600 hover:bg-blue-500'
        : 'bg-red-600 hover:bg-red-500';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] w-full max-w-md rounded-2xl p-8 border border-[var(--border-color)] shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{title}</h2>
                <p className="text-[var(--text-secondary)] mb-8">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-5 py-2.5 rounded-lg hover:bg-black/30 dark:hover:bg-white/20 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={`text-white font-semibold px-5 py-2.5 rounded-lg transition-colors ${confirmButtonClasses}`}>
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
