const supabase = require('../../config/supabaseClient');

const getPayoutAccounts = async (shopId) => {
    const { data, error } = await supabase
        .from('seller_payout_accounts')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

const addPayoutAccount = async (shopId, accountData) => {
    // If this is the first account, make it default automatically
    const existingAccounts = await getPayoutAccounts(shopId);
    if (existingAccounts.length === 0) {
        accountData.is_default = true;
    }

    if (accountData.is_default) {
        // Unset other defaults if this new one is default
        await setAllToNonDefault(shopId);
    }

    const { data, error } = await supabase
        .from('seller_payout_accounts')
        .insert([{ ...accountData, shop_id: shopId }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

const updatePayoutAccount = async (shopId, accountId, updates) => {
    if (updates.is_default) {
        await setAllToNonDefault(shopId);
    }

    const { data, error } = await supabase
        .from('seller_payout_accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', accountId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

const deletePayoutAccount = async (shopId, accountId) => {
    const { error } = await supabase
        .from('seller_payout_accounts')
        .delete()
        .eq('id', accountId)
        .eq('shop_id', shopId);

    if (error) throw error;
    return true;
};

const setAllToNonDefault = async (shopId) => {
    await supabase
        .from('seller_payout_accounts')
        .update({ is_default: false })
        .eq('shop_id', shopId);
};

module.exports = {
    getPayoutAccounts,
    addPayoutAccount,
    updatePayoutAccount,
    deletePayoutAccount
};
