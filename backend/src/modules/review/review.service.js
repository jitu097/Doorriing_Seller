const supabase = require('../../config/supabaseClient');
const { validatePagination } = require('../../utils/validators');

const getReviews = async (shopId, page = 1, limit = 20) => {
    const pagination = validatePagination(page, limit);
    
    const { data, error, count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1);
    
    if (error) throw error;
    
    return {
        reviews: data || [],
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: count,
            totalPages: Math.ceil(count / pagination.limit)
        }
    };
};

const toggleVisibility = async (reviewId, shopId, isVisible) => {
    const { data, error } = await supabase
        .from('reviews')
        .update({ is_visible: isVisible })
        .eq('id', reviewId)
        .eq('shop_id', shopId)
        .select()
        .single();
    
    if (error) throw error;
    
    return data;
};

const respondToReview = async (reviewId, shopId, sellerResponse) => {
    const { data, error } = await supabase
        .from('reviews')
        .update({
            seller_response: sellerResponse,
            responded_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .eq('shop_id', shopId)
        .select()
        .single();
    
    if (error) throw error;
    
    return data;
};

const getReviewStats = async (shopId) => {
    const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('shop_id', shopId)
        .eq('is_visible', true);
    
    if (error) throw error;
    
    const stats = {
        total: data.length,
        average: 0,
        ratings: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
    
    if (data.length > 0) {
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        stats.average = (sum / data.length).toFixed(2);
        
        data.forEach(review => {
            stats.ratings[review.rating]++;
        });
    }
    
    return stats;
};

module.exports = {
    getReviews,
    toggleVisibility,
    respondToReview,
    getReviewStats
};
