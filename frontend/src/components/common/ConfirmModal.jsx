import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', cancelText = 'Cancel', type = 'info', confirmInput = '' }) => {
    const [inputValue, setInputValue] = React.useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (confirmInput && inputValue !== confirmInput) {
            alert(`Please type "${confirmInput}" to confirm.`);
            return;
        }
        onConfirm();
    };

    return (
        <div className="modal-overlay">
            <div className={`modal-container ${type}`}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onCancel}>✕</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                    {confirmInput && (
                        <div className="confirm-input-group">
                            <label>Type <strong>{confirmInput}</strong> to confirm:</label>
                            <input 
                                type="text" 
                                value={inputValue} 
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={confirmInput}
                            />
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onCancel}>{cancelText}</button>
                    <button className={`btn-primary ${type === 'danger' ? 'btn-danger' : ''}`} onClick={handleConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
