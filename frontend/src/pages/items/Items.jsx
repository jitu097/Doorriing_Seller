import React, { useState } from 'react';
import './Items.css';

const Items = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const demoItems = [
        { id: 1, name: 'Butter Chicken', category: 'Main Course', price: 350, stock: 'In Stock', image: '🍗' },
        { id: 2, name: 'Paneer Tikka', category: 'Appetizer', price: 250, stock: 'In Stock', image: '🧆' },
        { id: 3, name: 'Veg Biryani', category: 'Main Course', price: 280, stock: 'Low Stock', image: '🍚' },
        { id: 4, name: 'Gulab Jamun', category: 'Dessert', price: 120, stock: 'In Stock', image: '🍮' },
        { id: 5, name: 'Masala Dosa', category: 'Breakfast', price: 150, stock: 'In Stock', image: '🌯' },
        { id: 6, name: 'Dal Makhani', category: 'Main Course', price: 220, stock: 'Out of Stock', image: '🥘' },
    ];

    const categories = ['all', 'Main Course', 'Appetizer', 'Dessert', 'Breakfast'];

    const filteredItems = demoItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getStockBadge = (stock) => {
        const badges = {
            'In Stock': 'stock-in',
            'Low Stock': 'stock-low',
            'Out of Stock': 'stock-out'
        };
        return badges[stock];
    };

    return (
        <div className="items-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Items Catalog</h1>
                    <p className="page-subtitle">Manage your menu items and inventory</p>
                </div>
                <button className="btn-primary">+ Add New Item</button>
            </div>

            <div className="items-controls">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="category-filters">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat === 'all' ? 'All Items' : cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="items-grid">
                {filteredItems.map(item => (
                    <div key={item.id} className="item-card">
                        <div className="item-image">
                            <span className="item-emoji">{item.image}</span>
                            <span className={`stock-badge ${getStockBadge(item.stock)}`}>
                                {item.stock}
                            </span>
                        </div>
                        <div className="item-content">
                            <h3 className="item-name">{item.name}</h3>
                            <p className="item-category">{item.category}</p>
                            <div className="item-footer">
                                <span className="item-price">₹{item.price}</span>
                                <div className="item-actions">
                                    <button className="btn-icon" title="Edit">✏️</button>
                                    <button className="btn-icon" title="Delete">🗑️</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="empty-state">
                    <span className="empty-icon">🔍</span>
                    <h3>No items found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            )}
        </div>
    );
};

export default Items;
