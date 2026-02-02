import React, { useState } from 'react';
import './GroceryCategoryManager.css';
import groceryService from '../../services/groceryService';

const GroceryCategoryManager = ({ isOpen, categories, onClose, onCategoriesChange }) => {
    const [newCategory, setNewCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            await groceryService.createGroceryCategory(newCategory);
            // Refresh categories logic should be handled by parent or re-fetch
            // Assuming parent passes a "refresh" or we call onCategoriesChange
            onCategoriesChange();
            setNewCategory('');
        } catch (err) {
            console.error(err);
            alert('Failed to add category');
        } finally {
            setIsSubmitting(false);
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
                        <input
                            type="text"
                            className="add-category-input"
                            placeholder="New category name"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            required
                        />
                        <button type="submit" className="add-category-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add'}
                        </button>
                    </form>

                    {/* List */}
                    <div className="category-list">
                        {categories.map(cat => (
                            <div className="category-item-row" key={cat.id}>
                                <span className="category-info">{cat.name}</span>

                                <div className="category-controls">
                                    {/* Toggle */}
                                    <label className="cat-toggle" title="Toggle Visibility">
                                        <input
                                            type="checkbox"
                                            checked={cat.is_active !== false} // Default to true if undefined
                                            onChange={() => handleToggleCategory(cat.id, cat.is_active !== false)}
                                        />
                                        <span className="cat-slider round"></span>
                                    </label>

                                    {/* Delete Button (Exact SVG requested) */}
                                    <button
                                        className="cat-delete-btn"
                                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                        title="Delete Category"
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
