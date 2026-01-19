import React from 'react';
import '../../styles/common/button.css';

const PrimaryButton = ({ children, onClick, type = 'button', variant = 'filled', className = '' }) => {
    return (
        <button
            type={type}
            className={`primary-btn ${variant} ${className}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default PrimaryButton;
