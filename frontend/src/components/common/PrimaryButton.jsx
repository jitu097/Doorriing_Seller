import React from 'react';
import './PrimaryButton.css';

const PrimaryButton = ({ children, onClick, type = 'button', disabled = false, variant = 'primary', style }) => {
    return (
        <button
            type={type}
            className={`primary-btn ${variant}`}
            onClick={onClick}
            disabled={disabled}
            style={style}
        >
            {children}
        </button>
    );
};

export default PrimaryButton;
