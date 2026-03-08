import React from 'react';
import './PayoutAccountCard.css';

const PayoutAccountCard = ({ account, onSelect, onEdit, isSelected }) => {
    const isUPI = account.type === 'upi';

    return (
        <div 
            className={`payout-account-card ${isSelected ? 'selected' : ''} ${account.is_default ? 'default' : ''}`}
            onClick={() => onSelect && onSelect(account)}
        >
            <div className="card-header">
                <span className="account-type-badge">{isUPI ? 'UPI' : 'Bank Transfer'}</span>
                {account.is_default && <span className="default-badge">Default</span>}
                {onEdit && (
                    <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(account); }}>
                        Edit
                    </button>
                )}
            </div>
            
            <div className="card-body">
                {isUPI ? (
                    <>
                        <div className="detail-row">
                            <span className="label">UPI ID</span>
                            <span className="value">{account.upi_id}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Name</span>
                            <span className="value">{account.contact_name}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="detail-row">
                            <span className="label">Bank</span>
                            <span className="value">{account.bank_name}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Account No</span>
                            <span className="value">••••{account.account_number?.slice(-4)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Holder</span>
                            <span className="value">{account.account_holder_name}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PayoutAccountCard;
