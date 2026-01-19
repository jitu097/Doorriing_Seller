import React, { useState } from 'react';
import PrimaryButton from '../../components/common/PrimaryButton';
import './CategorySetup.css'; // Reusing general setup styles potentially? Or isolate. Isolated for now.
import './ShopSetup.css'; // Reuse container styles

const CategorySetup = () => {
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState('');

    const addCategory = () => {
        if (!newCat.trim()) return;
        setCategories([...categories, { id: Date.now(), name: newCat, status: 'active' }]);
        setNewCat('');
    };

    const removeCategory = (id) => {
        setCategories(categories.filter(c => c.id !== id));
    };

    return (
        <div className="setup-container">
            <div className="setup-card">
                <div className="setup-header">
                    <h1 className="setup-title">Add Categories</h1>
                    <p className="setup-subtitle">Organize your items (e.g. Starters, Main Course)</p>
                </div>

                <div className="add-cat-form">
                    <input
                        type="text"
                        placeholder="Category Name"
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                    />
                    <button className="add-btn" onClick={addCategory}>Add</button>
                </div>

                <div className="category-list">
                    {categories.map(cat => (
                        <div key={cat.id} className="category-item">
                            <span className="cat-name">{cat.name}</span>
                            <div className="cat-actions">
                                <button onClick={() => removeCategory(cat.id)}>&times;</button>
                            </div>
                        </div>
                    ))}
                    {categories.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>No categories added yet.</p>}
                </div>

                <div style={{ marginTop: '32px' }}>
                    <PrimaryButton onClick={() => console.log('Done')}>Finish Setup</PrimaryButton>
                </div>
            </div>
        </div>
    );
};

export default CategorySetup;
