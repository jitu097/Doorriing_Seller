const supabase = require('../../config/supabaseClient');
const cache = require('../../utils/cache');
const { validatePagination } = require('../../utils/validators');

const SUMMARY_COLUMNS = 'balance, total_earnings, total_withdrawn, updated_at';

// Expose both camelCase and snake_case to preserve existing clients while supporting new ones.
const formatSummaryPayload = ({ balance, totalEarned, totalWithdrawn, updatedAt }) => ({
    balance,
    total_earnings: totalEarned,
    totalEarnings: totalEarned,
    total_withdrawn: totalWithdrawn,
    totalWithdrawn,
    updated_at: updatedAt,
    updatedAt
});

const buildDefaultSummary = () =>
    formatSummaryPayload({
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        updatedAt: null
    });

const normalizeSummary = (wallet) =>
    formatSummaryPayload({
        balance: Number(wallet?.balance) || 0,
        totalEarned: Number(wallet?.total_earnings ?? 0),
        totalWithdrawn: Number(wallet?.total_withdrawn ?? 0),
        updatedAt: wallet?.updated_at || null
    });

const getWalletSummary = async (shopId) => {
    const cacheKey = `wallet:summary:${shopId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const { data, error } = await supabase
            .from('seller_wallets')
            .select(SUMMARY_COLUMNS)
            .eq('shop_id', shopId)
            .maybeSingle();

        if (error) throw error;

        const wallet = data || null;
        const summary = wallet ? normalizeSummary(wallet) : buildDefaultSummary();

        cache.set(cacheKey, summary, 60); // Cache wallet summary for 60 seconds
        return summary;
    } catch (error) {
        console.error('Wallet summary error:', error.message, { shopId });
        const fallback = buildDefaultSummary();
        cache.set(cacheKey, fallback, 30);
        return fallback;
    }
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
        .select('id, order_id, amount, type, description, created_at', { count: 'exact' })
        .eq('wallet_id', wallet.id)
        .eq('shop_id', shopId);

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
        throw error;
    }

    return data;
};

module.exports = {
    getWalletSummary,
    getWalletTransactions,
    processOrderDelivery
};
