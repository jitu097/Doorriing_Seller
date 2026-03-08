const supabase = require('../../config/supabaseClient');
const { validatePagination } = require('../../utils/validators');

const getWalletSummary = async (shopId) => {
    let { data: wallet, error } = await supabase
        .from('seller_wallets')
        .select('*')
        .eq('shop_id', shopId)
        .single();

    if (error && error.code === 'PGRST116') {
        // No wallet exists yet, create one
        const { data: newWallet, error: createError } = await supabase
            .from('seller_wallets')
            .insert([{ shop_id: shopId }])
            .select()
            .single();
        
        if (createError) throw createError;
        wallet = newWallet;
    } else if (error) {
        throw error;
    }

    return wallet;
};

const getWalletTransactions = async (shopId, page = 1, limit = 20, type = null) => {
    const pagination = validatePagination(page, limit);

    const { data: wallet, error: walletError } = await supabase
        .from('seller_wallets')
        .select('id')
        .eq('shop_id', shopId)
        .single();

    if (walletError && walletError.code === 'PGRST116') {
        return { transactions: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } };
    } else if (walletError) {
        throw walletError;
    }

    let query = supabase
        .from('seller_wallet_transactions')
        .select('*', { count: 'exact' })
        .eq('wallet_id', wallet.id);

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw error;

    return {
        transactions: data || [],
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: count,
            totalPages: Math.ceil(count / pagination.limit)
        }
    };
};

const processOrderDelivery = async (orderId, shopId, amount) => {
    if (!amount || isNaN(amount)) {
        throw new Error('Invalid amount for wallet update');
    }

    const numericAmount = parseFloat(amount);

    // Call the RPC function
    const { data, error } = await supabase.rpc('process_delivered_order_wallet', {
        p_order_id: orderId,
        p_shop_id: shopId,
        p_amount: numericAmount
    });

    if (error) {
        console.error('Wallet update RPC error:', error);
        throw error;
    }

    return data;
};

module.exports = {
    getWalletSummary,
    getWalletTransactions,
    processOrderDelivery
};
