const supabase = require('../../config/supabaseClient');
const cache = require('../../utils/cache');

const bootstrapSeller = async (firebaseUid, email) => {
    const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, firebase_uid, email, role')
        .eq('firebase_uid', firebaseUid)
        .single();
    
    if (existingUser) {
        const { data: shop } = await supabase
            .from('shops')
            .select('id, shop_name, category, subcategory, is_open, is_accepting_orders')
            .eq('seller_id', existingUser.id)
            .single();
        
        return {
            user: existingUser,
            shop: shop || null
        };
    }
    
    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
            firebase_uid: firebaseUid,
            email: email,
            role: 'seller'
        })
        .select('id, firebase_uid, email, role')
        .single();
    
    if (insertError) throw insertError;
    
    cache.set(`seller:${firebaseUid}`, newUser, 600);
    
    return {
        user: newUser,
        shop: null
    };
};

const getProfile = async (sellerId) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, firebase_uid, email, role, created_at')
        .eq('id', sellerId)
        .single();
    
    if (error) throw error;
    
    const { data: shop } = await supabase
        .from('shops')
        .select(`
            id,
            shop_name,
            owner_name,
            email,
            phone,
            category,
            subcategory,
            description,
            address,
            city,
            state,
            pincode,
            shop_photo_url,
            is_open,
            is_accepting_orders,
            delivery_enabled,
            delivery_charge,
            min_order_amount,
            operating_hours,
            created_at
        `)
        .eq('seller_id', sellerId)
        .single();
    
    return {
        user: data,
        shop: shop || null
    };
};

module.exports = {
    bootstrapSeller,
    getProfile
};
