import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium', message = 'Loading...', variant = 'default' }) => {
    const sizeClasses = {
        small: 'loader-small',
        medium: 'loader-medium',
        large: 'loader-large'
    };

    return (
        <div className={`loader-container ${variant}`}>
            <div className={`loader-wrapper ${sizeClasses[size]}`}>
                {/* Road animation */}
                <div className="loader-road">
                    <div className="road-line"></div>
                    <div className="road-line"></div>
                    <div className="road-line"></div>
                </div>

                {/* Scooter animation */}
                <div className="loader-scooter">
                    <img 
                        src="/logo.png" 
                        alt="Loading" 
                        className="scooter-image"
                        onError={(e) => {
                            // Fallback if image not found
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'block';
                        }}
                    />
                    {/* Fallback icon */}
                    <div className="scooter-fallback" style={{ display: 'none' }}>
                        🛵
                    </div>
                </div>

                {/* Speed lines for motion effect */}
                <div className="speed-lines">
                    <span className="speed-line"></span>
                    <span className="speed-line"></span>
                    <span className="speed-line"></span>
                </div>
            </div>

            {/* Optional loading message */}
            {message && (
                <p className="loader-message">{message}</p>
            )}
        </div>
    );
};

export default Loader;
