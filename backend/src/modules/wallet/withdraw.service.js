const supabase = require('../../config/supabaseClient');
const { validatePagination } = require('../../utils/validators');
const notificationService = require('../notification/notification.service');

const getWithdrawRequests = async (shopId, page = 1, limit = 20) => {
    const pagination = validatePagination(page, limit);

    const { data, error, count } = await supabase
        .from('seller_withdraw_requests')
        .select(`
            *,
            payout_account:payout_account_id(*)
        `, { count: 'exact' })
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw error;

    return {
        requests: data || [],
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: count,
            totalPages: Math.ceil(count / pagination.limit)
        }
    };
};

const logWithdrawAlert = (scope, error) => {
    console.error(`[WithdrawService] ${scope}`, error);
};

const parseAmount = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : NaN;
};

const createWithdrawRequest = async (shopId, amount, payoutAccountId) => {
    const requestedAmount = parseAmount(amount);
    if (!requestedAmount || Number.isNaN(requestedAmount) || requestedAmount <= 0) {
        throw new Error('Invalid withdrawal amount');
    }

    if (!payoutAccountId) {
        throw new Error('Payout account is required');
    }

    // 1. Fetch wallet
    const { data: wallet, error: walletError } = await supabase
        .from('seller_wallets')
        .select('id, balance')
        .eq('shop_id', shopId)
        .single();
    
    if (walletError && walletError.code === 'PGRST116') {
        throw new Error('Wallet not found for this shop');
    } else if (walletError) {
        throw walletError;
    }

    // 2. Validate balance
    const walletBalance = parseAmount(wallet.balance);
    if (Number.isNaN(walletBalance) || walletBalance < requestedAmount) {
        throw new Error('Insufficient wallet balance for this withdrawal');
    }

    // 3. Optional: check if there's already a pending withdrawal to prevent spam 
    //    (depending on business requirements, allowing multiple is fine as long as balance covers it, 
    //    but tracking pending balance is safer. Alternatively, just ensure total pending + new amount <= balance)
    
    const { data: pendingRequests, error: pendingError } = await supabase
        .from('seller_withdraw_requests')
        .select('amount')
        .eq('shop_id', shopId)
        .eq('status', 'pending');
        
    if (pendingError) throw pendingError;
    
    const totalPending = pendingRequests.reduce((sum, req) => {
        const pendingAmount = parseAmount(req.amount);
        return sum + (Number.isNaN(pendingAmount) ? 0 : pendingAmount);
    }, 0);
    if ((totalPending + requestedAmount) > walletBalance) {
        throw new Error('Sum of pending withdrawals exceeds available balance');
    }

    // 4. Create request
    const { data, error } = await supabase
        .from('seller_withdraw_requests')
        .insert([{
            shop_id: shopId,
            wallet_id: wallet.id,
            payout_account_id: payoutAccountId,
            amount: requestedAmount,
            status: 'pending'
        }])
        .select()
        .single();

    if (error) throw error;

    try {
        const formattedAmount = requestedAmount.toFixed(2);
        await notificationService.createNotification(
            shopId,
            'Withdrawal Request Received',
            `We received your withdrawal request for ₹${formattedAmount}. Our team will review it shortly.`,
            'withdraw_submitted',
            data.id,
            'withdraw_request'
        );
    } catch (notifyError) {
        logWithdrawAlert('notification.create', notifyError);
    }

    return data;
};

module.exports = {
    getWithdrawRequests,
    createWithdrawRequest
};
