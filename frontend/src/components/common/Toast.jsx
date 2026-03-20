import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) setTimeout(onClose, 300); // Wait for fade-out
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`toast-message ${type} animate-in`}>
            <div className="toast-content">
                <span className="toast-icon">
                    {type === 'success' && '✅'}
                    {type === 'error' && '❌'}
                    {type === 'info' && '🔔'}
                </span>
                <span className="toast-text">{message}</span>
            </div>
            <button className="toast-close" onClick={() => setIsVisible(false)}>&times;</button>
        </div>
    );
};

export default Toast;
