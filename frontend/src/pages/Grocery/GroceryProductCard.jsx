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

    // Base quantity display logic
    const baseQty = Number(item.base_quantity) > 0 ? Number(item.base_quantity) : null;
    const unit = item.unit || '';
    const priceDisplay = baseQty && unit
        ? `${baseQty}${unit} - ₹${finalPrice.toFixed(2)}`
        : `₹${finalPrice.toFixed(2)}`;

    return (
        <div className="grocery-card">
            <div className="grocery-card-content">
                <div className="grocery-card-side">
                    <div className="grocery-card-side-meta">
                        {hasDiscount && discountLabel && (
                            <span className="grocery-card-discount-chip">{discountLabel}</span>
                        )}
                        <span className={`grocery-card-status ${item.is_available ? '' : 'inactive'}`}>
                            {item.is_available ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </div>

                    <div className="grocery-card-imgbox">
                        {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="grocery-card-img" loading="lazy" />
                        ) : (
                            <span className="grocery-card-placeholder">🛒</span>
                        )}
                    </div>

                    <div className="grocery-card-side-actions">
                        <button
                            className="action-btn delete-btn compact"
                            onClick={() => onDelete(item.id, item.name)}
                        >
                            <img src="/delete.png" alt="Delete" width="18" height="18" />
                            Delete
                        </button>
                        <button
                            className="action-btn edit-btn compact"
                            onClick={() => onEdit(item)}
                        >
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <path d="M14.7 2.29a1 1 0 0 1 1.42 0l1.59 1.59a1 1 0 0 1 0 1.42l-9.17 9.17-2.12.53.53-2.12 9.17-9.17z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                <path d="M12.88 4.12l2.12 2.12" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            Edit
                        </button>
                    </div>
                </div>

                <div className="grocery-card-body">
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
                        <span className="price-final">{priceDisplay}</span>
                        {hasDiscount && <span className="price-original">₹{basePrice.toFixed(2)}</span>}
                    </div>

                    <div className="grocery-card-switches">
                        <label className="availability-toggle" title="Toggle availability">
                            <input
                                type="checkbox"
                                checked={item.is_available}
                                onChange={() => onToggleStatus(item.id, item.is_available)}
                            />
                        </label>
                    </div>
                </div>

                </div>
            </div>
        </div>
    );
};

export default React.memo(GroceryProductCard);
