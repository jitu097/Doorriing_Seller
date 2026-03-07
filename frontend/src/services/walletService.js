import api from './api';

/**
 * Wallet Service - Handles all wallet-related API calls
 */

/**
 * Get the seller's wallet summary (balance, earnings, etc.)
 * @returns {Promise<Object>} Wallet summary object
 */
export const getWalletSummary = async () => {
  return api('/seller/wallet/summary', {
    method: 'GET'
  });
};

/**
 * Get wallet transaction history
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Transactions and pagination data
 */
export const getWalletTransactions = async (page = 1, limit = 20) => {
  return api(`/seller/wallet/transactions?page=${page}&limit=${limit}`, {
    method: 'GET'
  });
};

export const walletService = {
  getWalletSummary,
  getWalletTransactions
};

export default walletService;
