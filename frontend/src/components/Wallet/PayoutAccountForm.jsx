import React, { useState, useEffect } from 'react';
import './PayoutAccountForm.css';

const PayoutAccountForm = ({ account, onSubmit, onCancel }) => {
    const [type, setType] = useState('upi');
    const [formData, setFormData] = useState({
        upi_id: '',
        account_number: '',
        ifsc_code: '',
        bank_name: '',
        account_holder_name: '',
        contact_name: '',
        phone_number: '',
        is_default: false
    });

    useEffect(() => {
        if (account) {
            setType(account.type || 'upi');
            setFormData({
                upi_id: account.upi_id || '',
                account_number: account.account_number || '',
                ifsc_code: account.ifsc_code || '',
                bank_name: account.bank_name || '',
                account_holder_name: account.account_holder_name || '',
                contact_name: account.contact_name || '',
                phone_number: account.phone_number || '',
                is_default: account.is_default || false
            });
        }
    }, [account]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...formData, type };
        
        // Clean up payload based on type
        if (type === 'upi') {
            payload.account_number = null;
            payload.ifsc_code = null;
            payload.bank_name = null;
            payload.account_holder_name = null;
        } else {
            payload.upi_id = null;
        }
        
        onSubmit(payload);
    };

    return (
        <form className="payout-account-form" onSubmit={handleSubmit}>
            <h3>{account ? 'Edit Payout Account' : 'Add New Payout Account'}</h3>
            
            <div className="form-group">
                <label>Account Type</label>
                <div className="type-toggle">
                    <button 
                        type="button" 
                        className={type === 'upi' ? 'active' : ''} 
                        onClick={() => setType('upi')}
                    >
                        UPI
                    </button>
                    <button 
                        type="button" 
                        className={type === 'bank' ? 'active' : ''} 
                        onClick={() => setType('bank')}
                    >
                        Bank Transfer
                    </button>
                </div>
            </div>

            {type === 'upi' ? (
                <div className="form-group">
                    <label>UPI ID *</label>
                    <input 
                        type="text" 
                        name="upi_id" 
                        value={formData.upi_id} 
                        onChange={handleChange} 
                        placeholder="e.g. 9876543210@ybl"
                        required 
                    />
                </div>
            ) : (
                <>
                    <div className="form-group">
                        <label>Bank Name *</label>
                        <input 
                            type="text" 
                            name="bank_name" 
                            value={formData.bank_name} 
                            onChange={handleChange} 
                            placeholder="e.g. State Bank of India"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Account Holder Name *</label>
                        <input 
                            type="text" 
                            name="account_holder_name" 
                            value={formData.account_holder_name} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Account Number *</label>
                            <input 
                                type="text" 
                                name="account_number" 
                                value={formData.account_number} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>IFSC Code *</label>
                            <input 
                                type="text" 
                                name="ifsc_code" 
                                value={formData.ifsc_code} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="form-row">
                <div className="form-group">
                    <label>Contact Name *</label>
                    <input 
                        type="text" 
                        name="contact_name" 
                        value={formData.contact_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Phone Number *</label>
                    <input 
                        type="tel" 
                        name="phone_number" 
                        value={formData.phone_number} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
            </div>

            <div className="form-group checkbox-group">
                <label>
                    <input 
                        type="checkbox" 
                        name="is_default" 
                        checked={formData.is_default} 
                        onChange={handleChange} 
                    />
                    Set as default payout account
                </label>
            </div>

            <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn-save">Save Account</button>
            </div>
        </form>
    );
};

export default PayoutAccountForm;
