import React, { useRef } from 'react';
import './GroceryProductForm.css';

const GroceryProductForm = ({
    isOpen,
    title,
    formData,
    categories,
    onChange,
    onSubmit,
    onClose,
    isSubmitting
}) => {
    // If not open, don't render
    if (!isOpen) return null;

    // Handle background click to close
    const handleOverlayClick = (e) => {
        if (e.target.className === 'product-form-overlay') {
            onClose();
        }
    };

    return (
        <div className="product-form-overlay" onClick={handleOverlayClick}>
            <div className="product-form-card">
                {/* Header */}
                <div className="product-form-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onClose} title="Close">&times;</button>
                </div>

                <div className="product-form-divider"></div>

                {/* Body / Form */}
                <form onSubmit={onSubmit} className="product-form-body">

                    {/* Item Name */}
                    <div className="form-group">
                        <label>Item Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            value={formData.name}
                            onChange={onChange}
                            placeholder="e.g. Butter Chicken"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            className="form-control"
                            value={formData.description}
                            onChange={onChange}
                            placeholder="Short description of the item"
                        />
                    </div>

                    {/* Category & Price Row */}
                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Category</label>
                            <select
                                name="category_id"
                                className="form-control"
                                value={formData.category_id}
                                onChange={onChange}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group half-width">
                            <label>Price (₹)</label>
                            <input
                                type="number"
                                name="price"
                                className="form-control"
                                value={formData.price}
                                onChange={onChange}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    {/* Quantity & Unit Row */}
                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Quantity</label>
                            <input
                                type="number"
                                name="stock_quantity"
                                className="form-control"
                                value={formData.stock_quantity}
                                onChange={onChange}
                                placeholder="e.g. 100"
                                required
                            />
                        </div>
                        <div className="form-group half-width">
                            <label>Unit</label>
                            <select
                                name="unit"
                                className="form-control"
                                value={formData.unit}
                                onChange={onChange}
                                required
                            >
                                <option value="pieces">Pieces</option>
                                <option value="kg">Kg</option>
                                <option value="gram">Gram</option>
                                <option value="litre">Litre</option>
                                <option value="ml">ml</option>
                                <option value="packet">Packet</option>
                                <option value="box">Box</option>
                                <option value="dozen">Dozen</option>
                            </select>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="form-group">
                        <label>Image</label>
                        <div className="file-upload-wrapper">
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={onChange}
                                className="file-input"
                                id="file-upload-input"
                            />
                            <div className="file-upload-box">
                                {formData.image ? (
                                    <span className="file-name-display">Selected: {formData.image.name}</span>
                                ) : (
                                    <>
                                        <span>Click or Drag to Upload Image</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active Checkbox */}
                    <div className="form-group">
                        <label className="checkbox-group" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={onChange}
                                className="styled-checkbox"
                            />
                            <span className="checkbox-label" style={{ marginLeft: 8 }}>Active (Visible to users)</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="form-actions">
                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GroceryProductForm;
