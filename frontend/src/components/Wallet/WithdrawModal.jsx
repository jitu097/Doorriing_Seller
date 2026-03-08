import React, { useState, useEffect } from 'react';
import PayoutAccountCard from './PayoutAccountCard';
import PayoutAccountForm from './PayoutAccountForm';
import payoutService from '../../services/payoutService';
import Loader from '../common/Loader';
import './WithdrawModal.css';

const WithdrawModal = ({ isOpen, onClose, walletBalance, onSuccess }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('request'); // 'request' | 'form' | 'success'
    const [editingAccount, setEditingAccount] = useState(null);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAccounts();
            setView('request');
            setAmount('');
            setError('');
        }
    }, [isOpen]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await payoutService.getPayoutAccounts();
            setAccounts(data);
            
            // Auto-select default account
            const defaultAcc = data.find(a => a.is_default);
            if (defaultAcc && !selectedAccountId) {
                setSelectedAccountId(defaultAcc.id);
            } else if (data.length > 0 && !selectedAccountId) {
                setSelectedAccountId(data[0].id);
            }
        } catch (err) {
            setError('Failed to load payout accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAccount = async (accountData) => {
        try {
            setLoading(true);
            if (editingAccount) {
                await payoutService.updatePayoutAccount(editingAccount.id, accountData);
            } else {
                await payoutService.addPayoutAccount(accountData);
            }
            await fetchAccounts();
            setView('request');
            setEditingAccount(null);
        } catch (err) {
            setError(err.message || 'Failed to save account');
            setLoading(false);
        }
    };

    const handleSubmitWithdrawal = async (e) => {
        e.preventDefault();
        setError('');

        if (!amount || parseFloat(amount) <= 0) {
            return setError('Enter a valid amount');
        }

        if (parseFloat(amount) > walletBalance) {
            return setError('Amount exceeds wallet balance');
        }

        if (!selectedAccountId) {
            return setError('Please select a payout account');
        }

        try {
            setSubmitting(true);
            await payoutService.createWithdrawRequest({
                amount: parseFloat(amount),
                payoutAccountId: selectedAccountId
            });
            setView('success');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to request withdrawal');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content withdraw-modal">
                <button className="modal-close" onClick={onClose}>×</button>
                
                {view === 'success' ? (
                    <div className="withdraw-success-view" style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', color: '#28a745', marginBottom: '16px' }}>✓</div>
                        <h2 style={{ marginBottom: '16px', color: '#212529' }}>Thank You!</h2>
                        <p style={{ color: '#495057', fontSize: '1.1rem', lineHeight: '1.5' }}>
                            Your request has been submitted successfully.
                            <br /><br />
                            <strong>It takes 10 to 24 hours to credit in your account.</strong>
                        </p>
                    </div>
                ) : view === 'form' ? (
                    <PayoutAccountForm 
                        account={editingAccount} 
                        onSubmit={handleSaveAccount} 
                        onCancel={() => { setView('request'); setEditingAccount(null); }} 
                    />
                ) : (
                    <div className="withdraw-request-view">
                        <h2>Request Withdrawal</h2>
                        
                        <div className="wallet-summary-box">
                            <span className="label">Available Balance</span>
                            <span className="balance">₹{walletBalance.toLocaleString()}</span>
                        </div>

                        {error && <div className="error-alert">{error}</div>}

                        <form onSubmit={handleSubmitWithdrawal}>
                            <div className={`form-group amount-group ${amount && parseFloat(amount) > walletBalance ? 'has-error' : ''}`}>
                                <label>Amount to Withdraw (₹)</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={walletBalance} 
                                    step="0.01"
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)} 
                                    placeholder="0.00"
                                    required
                                />
                                {amount && parseFloat(amount) > walletBalance && (
                                    <span className="amount-error-text">Amount cannot exceed available balance.</span>
                                )}
                            </div>

                            <div className="payout-accounts-section">
                                <div className="section-header">
                                    <h3>Select Payout Account</h3>
                                    <button 
                                        type="button" 
                                        className="add-new-btn"
                                        onClick={() => { setEditingAccount(null); setView('form'); }}
                                    >
                                        + Add New
                                    </button>
                                </div>
                                
                                {loading ? (
                                    <Loader variant="inline" />
                                ) : accounts.length === 0 ? (
                                    <div className="no-accounts-message">
                                        No payout accounts saved. Please add one to withdraw funds.
                                    </div>
                                ) : (
                                    <div className="accounts-list">
                                        {accounts.map(acc => (
                                            <PayoutAccountCard 
                                                key={acc.id}
                                                account={acc}
                                                isSelected={selectedAccountId === acc.id}
                                                onSelect={() => setSelectedAccountId(acc.id)}
                                                onEdit={(account) => { setEditingAccount(account); setView('form'); }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
                                <button 
                                    type="submit" 
                                    className="btn-withdraw" 
                                    disabled={submitting || accounts.length === 0 || !amount || parseFloat(amount) > walletBalance}
                                >
                                    {submitting ? 'Processing...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WithdrawModal;
