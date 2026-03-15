import React from 'react';
import './Menu.css';

const formatCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
        return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const MenuItemCard = ({ item, onToggle, onDelete, onEdit }) => {
    const resolvedFoodType = item?.food_type?.toLowerCase() === 'nonveg' ? 'nonveg' : 'veg';
    const isNonVeg = resolvedFoodType === 'nonveg';
    const fullBasePrice = Number(item.full_price ?? item.price ?? 0);
    const fullFinalPrice = Number(item.full_final_price ?? item.final_price ?? fullBasePrice);
    const fullHasDiscount = fullBasePrice > 0 && fullFinalPrice < fullBasePrice;
    const hasHalfPortion = item.half_portion_price !== null && typeof item.half_portion_price !== 'undefined';
    const halfBasePrice = hasHalfPortion ? Number(item.half_portion_price ?? 0) : 0;
    const halfFinalPrice = hasHalfPortion ? Number(item.half_portion_final_price ?? item.half_portion_price ?? 0) : 0;
    const halfHasDiscount = hasHalfPortion && halfBasePrice > 0 && halfFinalPrice < halfBasePrice;

    return (
        <div className="item-card-modern">
            <div className="item-image-container">
                <img
                    src={item.image_url || '/avatar-default.png'}
                    alt={item.name}
                    className="item-image"
                />
                <span className={`status-badge ${item.is_available ? 'active' : 'inactive'}`}>
                    {item.is_available ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </div>

            <div className="item-details">
                <div className="item-name-row">
                    <h3 className="item-name">{item.name}</h3>
                    <span className={`food-type-pill ${isNonVeg ? 'nonveg' : 'veg'}`}>
                        {isNonVeg ? '🔴 Non-Veg' : '🟢 Veg'}
                    </span>
                </div>
                {item.subcategory?.name && (
                    <p className="item-subcategory" style={{ color: '#6b7280', fontSize: '0.85rem', margin: '2px 0 6px 0' }}>
                        {item.category?.name} › {item.subcategory.name}
                    </p>
                )}
                <p className="item-description">{item.description}</p>

                <div className="portion-pricing">
                    <div className="portion-row">
                        <div>
                            <div className="portion-label">Full Plate</div>
                            <div className="portion-values">
                                {fullHasDiscount && <span className="price-original">{formatCurrency(fullBasePrice)}</span>}
                                <span className="price-final">{formatCurrency(fullFinalPrice || fullBasePrice)}</span>
                            </div>
                        </div>
                    </div>
                    {hasHalfPortion && (
                        <div className="portion-row">
                            <div>
                                <div className="portion-label">Half Plate</div>
                                <div className="portion-values">
                                    {halfHasDiscount && <span className="price-original">{formatCurrency(halfBasePrice)}</span>}
                                    <span className="price-final">{formatCurrency(halfFinalPrice || halfBasePrice)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="item-actions">
                <div className="toggle-wrapper">
                    <label className="switch-modern">
                        <input
                            type="checkbox"
                            checked={item.is_available}
                            onChange={() => onToggle(item.id)}
                        />
                        <span className="slider-modern round"></span>
                    </label>
                </div>

                <button
                    className="action-btn edit-btn"
                    onClick={() => onEdit(item)}
                    title="Edit Item"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>

                <button
                    className="action-btn delete-btn"
                    onClick={() => onDelete(item.id)}
                    title="Delete Item"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MenuItemCard;
