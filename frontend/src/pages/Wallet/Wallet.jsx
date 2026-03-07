import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/walletService';
import Loader from '../../components/common/Loader';
import './Wallet.css';

const WalletPage = () => {
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchWalletData();
    }, [page]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [summaryData, txData] = await Promise.all([
                walletService.getWalletSummary(),
                walletService.getWalletTransactions(page, 10)
            ]);

            setSummary(summaryData);
            if (txData) {
                setTransactions(txData.transactions || []);
                setTotalPages(txData.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error('Failed to fetch wallet data', err);
            setError('Could not load wallet details. ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

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
            <div className="wallet-header">
                <h1>Seller Wallet</h1>
                <p>Manage your earnings and view transaction history</p>
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
                <h2>Transaction History</h2>
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
                                    <td colSpan="5" className="empty-state">No transactions found</td>
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
                                        <td className={tx.type === 'withdrawal' ? 'amount-negative' : 'amount-positive'}>
                                            {tx.type === 'withdrawal' ? '-' : '+'}₹{tx.amount?.toLocaleString()}
                                        </td>
                                        <td>{tx.description || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {totalPages > 1 && (
                    <div className="pagination">
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(p => p - 1)}>
                            Previous
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button 
                            disabled={page === totalPages} 
                            onClick={() => setPage(p => p + 1)}>
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletPage;
