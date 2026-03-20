import React, { useState, useEffect, useCallback } from 'react';
import { walletService } from '../../services/walletService';
import { payoutService } from '../../services/payoutService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import Loader from '../../components/common/Loader';
import WithdrawModal from '../../components/Wallet/WithdrawModal';
import './Wallet.css';

const WalletPage = () => {
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [withdrawRequests, setWithdrawRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Pagination states
    const [txPage, setTxPage] = useState(1);
    const [txTotalPages, setTxTotalPages] = useState(1);
    const [reqPage, setReqPage] = useState(1);
    const [reqTotalPages, setReqTotalPages] = useState(1);
    
    // UI states
    const [activeTab, setActiveTab] = useState('earnings'); // 'earnings' or 'withdrawals'
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    useRealtimeSubscription('seller_wallets', () => { setTimeout(fetchSummaryData, 0); });
    useRealtimeSubscription('seller_wallet_transactions', () => { setTimeout(fetchEarningsHistory, 0); });

    useEffect(() => {
        fetchSummaryData();
    }, []);

    useEffect(() => {
        if (activeTab === 'earnings') {
            fetchEarningsHistory();
        } else {
            fetchWithdrawRequests();
        }
    }, [activeTab, txPage, reqPage]);

    const fetchSummaryData = useCallback(async () => {
        try {
            setLoading(true);
            const summaryData = await walletService.getWalletSummary();
            setSummary(summaryData);
        } catch (err) {
            console.error('Failed to fetch wallet summary', err);
            setError('Could not load wallet details.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEarningsHistory = useCallback(async () => {
        try {
            const txData = await walletService.getWalletTransactions(txPage, 10, 'order_earning');
            if (txData) {
                setTransactions(txData.transactions || []);
                setTxTotalPages(txData.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        }
    }, [txPage]);

    const fetchWithdrawRequests = useCallback(async () => {
        try {
            const reqData = await payoutService.getWithdrawRequests(reqPage, 10);
            if (reqData) {
                setWithdrawRequests(reqData.requests || []);
                setReqTotalPages(reqData.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error('Failed to fetch withdraw requests', err);
        }
    }, [reqPage]);

    const handleWithdrawalSuccess = useCallback(() => {
        fetchSummaryData();
        if (activeTab === 'withdrawals') {
            fetchWithdrawRequests();
        } else {
            setActiveTab('withdrawals'); // switch to withdrawals to see the pending request
        }
    }, [activeTab, fetchSummaryData, fetchWithdrawRequests]);

    if (loading && !summary) {
        return <Loader variant="fullscreen" message="Loading Wallet..." />;
    }

    if (error && !summary) {
        return <div className="wallet-container"><div className="error-message">{error}</div></div>;
    }

    const currentBalance = summary?.balance || 0;
    const totalEarnings = summary?.total_earnings || 0;
    const totalWithdrawn = summary?.total_withdrawn || 0;

    return (
        <div className="wallet-container">
            <div className="wallet-header-actions">
                <div className="wallet-header">
                    <h1>Seller Wallet</h1>
                    <p>Manage your earnings and request withdrawals</p>
                </div>
                <button 
                    className="btn-withdraw-main" 
                    onClick={() => setShowDisclaimer(true)}
                    disabled={currentBalance <= 0}
                >
                    + Request Withdrawal
                </button>
            </div>

            <div className="wallet-stats-grid">
                <div className="wallet-stat-card">
                    <div className="wallet-stat-icon balance">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                            <line x1="6" y1="16" x2="6.01" y2="16" />
                        </svg>
                    </div>
                    <div className="wallet-stat-info">
                        <h3>Current Balance</h3>
                        <p className="wallet-stat-value">₹{currentBalance.toLocaleString()}</p>
                    </div>
                </div>

                <div className="wallet-stat-card">
                    <div className="wallet-stat-icon earnings">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                        </svg>
                    </div>
                    <div className="wallet-stat-info">
                        <h3>Total Earnings</h3>
                        <p className="wallet-stat-value">₹{totalEarnings.toLocaleString()}</p>
                    </div>
                </div>

                <div className="wallet-stat-card">
                    <div className="wallet-stat-icon withdrawn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 17l-5 5-5-5" />
                            <path d="M12 22V2" />
                        </svg>
                    </div>
                    <div className="wallet-stat-info">
                        <h3>Total Withdrawn</h3>
                        <p className="wallet-stat-value">₹{totalWithdrawn.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="wallet-transactions-section">
                <div className="transactions-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('earnings')}
                    >
                        Earnings History
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`}
                        onClick={() => setActiveTab('withdrawals')}
                    >
                        Withdrawal Requests
                    </button>
                </div>

                {activeTab === 'earnings' ? (
                    <div className="transactions-table-container">
                        <table className="wallet-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Order ID</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="empty-state">No earnings found</td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td>{new Date(tx.created_at).toLocaleString()}</td>
                                            <td>{tx.order_id ? `#${tx.order_id.substring(0, 8)}` : '-'}</td>
                                            <td>
                                                <span className={`transaction-type-badge ${tx.type}`}>
                                                    {tx.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="amount-positive">
                                                +₹{tx.amount?.toLocaleString()}
                                            </td>
                                            <td>{tx.description || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {txTotalPages > 1 && (
                            <div className="pagination">
                                <button disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}>Previous</button>
                                <span>Page {txPage} of {txTotalPages}</span>
                                <button disabled={txPage === txTotalPages} onClick={() => setTxPage(p => p + 1)}>Next</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="transactions-table-container">
                        <table className="wallet-table">
                            <thead>
                                <tr>
                                    <th>Request Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Account Type</th>
                                    <th>Admin Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="empty-state">No withdrawal requests found</td>
                                    </tr>
                                ) : (
                                    withdrawRequests.map((req) => (
                                        <tr key={req.id}>
                                            <td>{new Date(req.created_at).toLocaleString()}</td>
                                            <td className="amount-negative">₹{req.amount.toLocaleString()}</td>
                                            <td>
                                                <span className={`transaction-type-badge status-${req.status}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td>{req.payout_account?.type === 'upi' ? 'UPI' : 'Bank Transfer'}</td>
                                            <td className="admin-notes">{req.admin_notes || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {reqTotalPages > 1 && (
                            <div className="pagination">
                                <button disabled={reqPage === 1} onClick={() => setReqPage(p => p - 1)}>Previous</button>
                                <span>Page {reqPage} of {reqTotalPages}</span>
                                <button disabled={reqPage === reqTotalPages} onClick={() => setReqPage(p => p + 1)}>Next</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <WithdrawModal 
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                walletBalance={currentBalance}
                onSuccess={handleWithdrawalSuccess}
            />

            {showDisclaimer && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ padding: '32px', maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', color: '#1890ff', marginBottom: '16px' }}>ℹ️</div>
                        <h3 style={{ marginBottom: '16px', color: '#212529' }}>Withdrawal Notice</h3>
                        <p style={{ color: '#495057', fontSize: '1.05rem', marginBottom: '24px', lineHeight: '1.5' }}>
                            It takes <strong>10 to 24 hours</strong> to credit the amount to your account after a withdrawal request is submitted.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button 
                                onClick={() => setShowDisclaimer(false)}
                                style={{ padding: '12px 24px', border: '1px solid #ced4da', background: '#fff', color: '#495057', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    setShowDisclaimer(false);
                                    setIsWithdrawModalOpen(true);
                                }}
                                style={{ padding: '12px 24px', border: 'none', background: '#28a745', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                            >
                                OK, Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletPage;
