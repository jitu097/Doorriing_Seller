const supabase = require('../../config/supabaseClient');
const { validatePagination } = require('../../utils/validators');

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

const createWithdrawRequest = async (shopId, amount, payoutAccountId) => {
    // Basic validation
    if (!amount || isNaN(amount) || amount <= 0) {
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
    if (parseFloat(wallet.balance) < parseFloat(amount)) {
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
    
    const totalPending = pendingRequests.reduce((sum, req) => sum + parseFloat(req.amount), 0);
    if ((totalPending + parseFloat(amount)) > parseFloat(wallet.balance)) {
        throw new Error('Sum of pending withdrawals exceeds available balance');
    }

    // 4. Create request
    const { data, error } = await supabase
        .from('seller_withdraw_requests')
        .insert([{
            shop_id: shopId,
            wallet_id: wallet.id,
            payout_account_id: payoutAccountId,
            amount: parseFloat(amount),
            status: 'pending'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getWithdrawRequests,
    createWithdrawRequest
};
