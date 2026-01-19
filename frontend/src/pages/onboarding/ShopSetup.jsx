import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '../../components/common/PrimaryButton';
import './ShopSetup.css';

const ShopSetup = () => {
    const [businessType, setBusinessType] = useState(''); // 'shop' or 'hotel'
    const [shopName, setShopName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Mock API Call to create shop
        console.log({ businessType, shopName, description });

        setTimeout(() => {
            setLoading(false);
            navigate('/dashboard'); // Should go to category setup ideally, or dashboard
        }, 1000);
    };

    return (
        <div className="setup-container">
            <div className="setup-card">
                <div className="setup-header">
                    <h1 className="setup-title">Setup Your Business</h1>
                    <p className="setup-subtitle">Tell us a bit about what you're selling</p>
                </div>

                <form className="setup-form" onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Business Type</label>
                        <div className="type-selection">
                            <div
                                className={`type-card ${businessType === 'shop' ? 'selected' : ''}`}
                                onClick={() => setBusinessType('shop')}
                            >
                                <div className="type-details">
                                    <h3>Shop</h3>
                                    <p>Retail, Groceries, etc.</p>
                                </div>
                            </div>
                            <div
                                className={`type-card ${businessType === 'hotel' ? 'selected' : ''}`}
                                onClick={() => setBusinessType('hotel')}
                            >
                                <div className="type-details">
                                    <h3>Restaurant/Hotel</h3>
                                    <p>Food, Meals, etc.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="shopName">Business Name</label>
                        <input
                            type="text"
                            id="shopName"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            placeholder="e.g. Fresh Mart, Spicy Bites"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            className="form-control"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description of your business..."
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                        ></textarea>
                    </div>

                    <PrimaryButton type="submit" disabled={loading || !businessType}>
                        {loading ? 'Setting up...' : 'Continue'}
                    </PrimaryButton>
                </form>
            </div>
        </div>
    );
};

export default ShopSetup;
