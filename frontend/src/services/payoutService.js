import api from './api';

export const getPayoutAccounts = async () => {
  return api('/seller/wallet/payout-accounts', {
    method: 'GET'
  });
};

export const addPayoutAccount = async (accountData) => {
  return api('/seller/wallet/payout-accounts', {
    method: 'POST',
    body: JSON.stringify(accountData)
  });
};

export const updatePayoutAccount = async (id, accountData) => {
  return api(`/seller/wallet/payout-accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(accountData)
  });
};

export const deletePayoutAccount = async (id) => {
  return api(`/seller/wallet/payout-accounts/${id}`, {
    method: 'DELETE'
  });
};

export const getWithdrawRequests = async (page = 1, limit = 20) => {
  return api(`/seller/wallet/withdraw-requests?page=${page}&limit=${limit}`, {
    method: 'GET'
  });
};

export const createWithdrawRequest = async (requestData) => {
  return api('/seller/wallet/withdraw-requests', {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
};

export const payoutService = {
  getPayoutAccounts,
  addPayoutAccount,
  updatePayoutAccount,
  deletePayoutAccount,
  getWithdrawRequests,
  createWithdrawRequest
};

export default payoutService;
