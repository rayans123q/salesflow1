import React, { useEffect } from 'react';

interface NotificationProps {
    notification: { type: 'success' | 'error'; message: string } | null;
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);

    if (!notification) return null;

    return (
        <div className={`fixed top-5 right-5 p-4 rounded-lg z-[100] text-white animate-fade-in shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notification.message}
        </div>
    );
};

export default Notification;
