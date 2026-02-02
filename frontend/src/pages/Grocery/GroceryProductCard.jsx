import React from 'react';
import './GroceryProductCard.css';

const GroceryProductCard = ({ item, onEdit, onDelete, onToggleStatus }) => {
    return (
        <div className="grocery-card">
            {/* Active Status Badge (Top Right or Left) */}
            {item.is_available ? (
                <span className="grocery-card-badge">ACTIVE</span>
            ) : (
                <span className="grocery-card-badge inactive">INACTIVE</span>
            )}

            {/* Image Section */}
            <div className="grocery-card-imgbox">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="grocery-card-img" />
                ) : (
                    <span className="grocery-card-placeholder">🛒</span>
                )}
            </div>

            {/* Main Content */}
            <div className="grocery-card-main">
                {/* Header: Title & Actions */}
                <div className="grocery-card-header">
                    <h3 className="grocery-card-title">{item.name}</h3>
                    <div className="grocery-card-actions">
                        <button
                            className="icon-btn edit"
                            title="Edit"
                            onClick={() => onEdit(item)}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M14.7 2.29a1 1 0 0 1 1.42 0l1.59 1.59a1 1 0 0 1 0 1.42l-9.17 9.17-2.12.53.53-2.12 9.17-9.17z" stroke="#b85c1c" strokeWidth="1.5" fill="none" />
                                <path d="M12.88 4.12l2.12 2.12" stroke="#b85c1c" strokeWidth="1.5" />
                            </svg>
                        </button>
                        <button
                            className="icon-btn delete"
                            title="Delete"
                            onClick={() => onDelete(item.id, item.name)}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="5.5" y="8" width="9" height="7" rx="2" stroke="#b85c1c" strokeWidth="1.5" />
                                <path d="M8 10v3m4-3v3" stroke="#b85c1c" strokeWidth="1.5" />
                                <rect x="8" y="4" width="4" height="2" rx="1" stroke="#b85c1c" strokeWidth="1.5" />
                                <path d="M4 6h12" stroke="#b85c1c" strokeWidth="1.5" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Price Display */}
                <div className="grocery-card-info">
                    {/* Replaced 'Half' Price with simple layout logic if needed, but user asked for Half removal and Qty addition */}
                    <div className="grocery-card-price-tag">
                        Full: ₹{item.price}
                    </div>
                </div>

                {/* Footer: Best Seller, Qty, Toggle */}
                <div className="grocery-card-footer">
                    <label className="bestseller-tag">
                        {/* Using checkbox for visual consistency with previous design, but readOnly */}
                        <input type="checkbox" checked={item.is_best_seller || false} readOnly />
                        <span>Best Seller</span>
                    </label>

                    <span className="qty-display">
                        Qty: {item.stock_quantity} {item.unit}
                    </span>

                    <label className="availability-toggle" title="Toggle Availability">
                        <span className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={item.is_available}
                                onChange={() => onToggleStatus(item.id, item.is_available)}
                            />
                            <span className="toggle-slider round"></span>
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default GroceryProductCard;
