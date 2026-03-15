import React from 'react';
import './GroceryProductCard.css';

const GroceryProductCard = ({ item, onEdit, onDelete, onToggleStatus }) => {
    const resolveNumber = (value, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const basePrice = resolveNumber(item.price ?? item.full_price, 0);
    const finalPrice = resolveNumber(item.final_price ?? item.full_final_price, basePrice);
    const hasDiscount = finalPrice > 0 && finalPrice < basePrice;
    const discountLabelSource = item.discount_type && item.discount_type !== 'none'
        ? { type: item.discount_type, value: item.discount_value }
        : item.full_discount_type && item.full_discount_type !== 'none'
            ? { type: item.full_discount_type, value: item.full_discount_value }
            : null;
    const formatDiscountLabel = (source) => {
        if (!source) return null;
        const numericValue = resolveNumber(source.value, 0);
        return source.type === 'percentage'
            ? `${numericValue}% OFF`
            : `₹${numericValue.toFixed(0)} OFF`;
    };
    const discountLabel = formatDiscountLabel(discountLabelSource);

    return (
        <div className="grocery-card">
            {/* Active Status Badge (Top Left) */}
            {item.is_available ? (
                <span className="grocery-card-badge">ACTIVE</span>
            ) : (
                <span className="grocery-card-badge inactive">INACTIVE</span>
            )}

            {hasDiscount && discountLabel && (
                <span className="grocery-card-discount-chip">{discountLabel}</span>
            )}

            {/* Image Section - Full Width at Top */}
            <div className="grocery-card-imgbox">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="grocery-card-img" />
                ) : (
                    <span className="grocery-card-placeholder">🛒</span>
                )}
            </div>

            {/* Main Content Below Image */}
            <div className="grocery-card-content">
                {/* Title */}
                <h3 className="grocery-card-title">{item.name}</h3>

                {/* Description/Category */}
                {item.subcategory?.name ? (
                    <p className="grocery-card-description">
                        {item.category?.name} › {item.subcategory.name}
                    </p>
                ) : item.description ? (
                    <p className="grocery-card-description">{item.description}</p>
                ) : null}

                {/* Stock Status */}
                <div className="grocery-card-stock">
                    {item.stock_quantity} {item.unit?.toUpperCase() || 'PIECES'} IN STOCK
                </div>

                {/* Price and Toggle Row */}
                <div className="grocery-card-price-row">
                    <div className="grocery-card-price">
                        {hasDiscount && <span className="price-original">₹{basePrice.toFixed(2)}</span>}
                        <span className="price-final">₹{finalPrice.toFixed(2)}</span>
                    </div>
                    
                    {/* Toggle Availability */}
                    <label className="availability-toggle">
                        <input
                            type="checkbox"
                            checked={item.is_available}
                            onChange={() => onToggleStatus(item.id, item.is_available)}
                        />
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="grocery-card-actions">
                    <button
                        className="action-btn edit-btn"
                        onClick={() => onEdit(item)}
                    >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                            <path d="M14.7 2.29a1 1 0 0 1 1.42 0l1.59 1.59a1 1 0 0 1 0 1.42l-9.17 9.17-2.12.53.53-2.12 9.17-9.17z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M12.88 4.12l2.12 2.12" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        Edit
                    </button>
                    <button
                        className="action-btn delete-btn"
                        onClick={() => onDelete(item.id, item.name)}
                    >
                        <img src="/delete.png" alt="Delete" width="18" height="18" />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroceryProductCard;
