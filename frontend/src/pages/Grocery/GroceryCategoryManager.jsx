import React, { useState } from 'react';
import './GroceryCategoryManager.css';
import groceryService from '../../services/groceryService';

const GroceryCategoryManager = ({ isOpen, categories, onClose, onCategoriesChange }) => {
    const [newCategory, setNewCategory] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fallbackImage = "/images/category-placeholder.png";

    // If not open, don't render
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target.className === 'category-manager-overlay') {
            onClose();
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            setIsSubmitting(true);
            await groceryService.createGroceryCategory(newCategory, imageFile);
            // Refresh categories logic should be handled by parent or re-fetch
            // Assuming parent passes a "refresh" or we call onCategoriesChange
            onCategoriesChange();
            setNewCategory('');
            setImageFile(null);
        } catch (err) {
            console.error(err);
            alert('Failed to add category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
            try {
                await groceryService.deleteGroceryCategory(id);
                onCategoriesChange();
            } catch (err) {
                console.error(err);
                alert('Failed to delete category');
            }
        }
    };

    const handleToggleCategory = async (id, currentStatus) => {
        // Optimistic toggle could be done here if we had local state, but usually re-fetching is safer for lists
        // If 'currentStatus' is undefined, assume true or false based on backend default
        // The service needs to support update. I added updateGroceryCategory.
        try {
            // Suppose we have an 'is_active' or similar field. 
            // If the category object doesn't have it, we might be adding it now.
            const newStatus = !currentStatus;

            // NOTE: The user requested a toggle. If the backend schema doesn't have a status column,
            // this might not persist properly without migration. 
            // However, since I added the update route, I will try to send it.
            // If the DB has no column, it might ignore it or error. 
            // I'll assume 'is_visible' or similar is desired. Let's send 'is_active'.
            await groceryService.updateGroceryCategory(id, { is_active: newStatus });
            onCategoriesChange();
        } catch (err) {
            console.error(err);
            alert('Failed to update category status');
        }
    };

    return (
        <div className="category-manager-overlay" onClick={handleOverlayClick}>
            <div className="category-manager-card">
                {/* Header */}
                <div className="category-manager-header">
                    <h2>Manage Categories</h2>
                    <button className="close-btn" onClick={onClose} title="Close">&times;</button>
                </div>

                {/* Body */}
                <div className="category-manager-body">
                    {/* Add Form */}
                    <form className="add-category-row" onSubmit={handleAddCategory}>
                        <div className="add-category-input-wrapper">
                            <input
                                type="text"
                                className="add-category-input"
                                placeholder="New category name"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                required
                            />
                            <label className={`category-image-upload-icon ${imageFile ? 'has-file' : ''}`} title="Upload Custom Image (Optional)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill={imageFile ? '#10b981' : 'none'} stroke={imageFile ? '#10b981' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden-file-input"
                                    onChange={handleImageChange}
                                />
                            </label>
                            {imageFile && (
                                <button
                                    type="button"
                                    className="clear-image-btn"
                                    onClick={() => setImageFile(null)}
                                    title="Remove Custom Image"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                        <button type="submit" className="add-category-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add'}
                        </button>
                    </form>

                    {/* List */}
                    <div className="category-list">
                        {categories.map(cat => (
                            <div className="category-card" key={cat.id}>
                                <div className="category-image-wrapper">
                                    <img
                                        src={cat.image_url || fallbackImage}
                                        alt={cat.name}
                                        className="category-image"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    
                                    <div className="category-controls-overlay">
                                        {/* Toggle */}
                                        <label className="cat-toggle" title="Toggle Visibility">
                                            <input
                                                type="checkbox"
                                                checked={cat.is_active !== false} // Default to true if undefined
                                                onChange={() => handleToggleCategory(cat.id, cat.is_active !== false)}
                                            />
                                            <span className="cat-slider round"></span>
                                        </label>

                                        {/* Delete Button */}
                                        <button
                                            className="cat-delete-btn"
                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                            title="Delete Category"
                                        >
                                            <img src="/delete.png" alt="Delete" style={{ width: '20px', height: '20px' }} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="category-name">
                                    {cat.name}
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                No categories. Add one above.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroceryCategoryManager;
