
import React, { useState } from 'react';
import Navbar from './Navbar';
import './Profile.css';

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeSection, setActiveSection] = useState('shop');

    // Mock Data
    const [shopData, setShopData] = useState({
        shopName: 'Green Valley Grocery',
        description: 'Premium organic grocery store providing fresh farm produce daily.',
        address: '123 Market Street, Civil Lines',
        city: 'Jaipur',
        pincode: '302006',
        contact: '+91 98765 43210',
        email: 'contact@greenvalley.com',
        gstin: '29ABCDE1234F1Z5',
        fssai: '12345678901234',
        ownerName: 'Rajesh Kumar',
        category: 'Grocery & Staples',
        openingTime: '08:00',
        closingTime: '22:00',
        isOpen: true
    });

    const handleSave = () => {
        setIsEditing(false);
        // Save logic here
    };

    return (
        <>
            <Navbar />
            <div className="admin-container">
                <div className="profile-header-card">
                    <div className="profile-cover">
                        <button className="edit-cover-btn">📷 Change Cover</button>
                    </div>
                    <div className="profile-info-bar">
                        <div className="profile-avatar">
                            <img src="https://ui-avatars.com/api/?name=Green+Valley&background=FFA500&color=fff&size=128" alt="Shop Logo" />
                            <button className="edit-avatar-btn">✏️</button>
                        </div>
                        <div className="profile-basics">
                            <h1>{shopData.shopName}</h1>
                            <p className="profile-category">{shopData.category}</p>
                            <p className="profile-location">📍 {shopData.city}</p>
                        </div>
                        <div className="profile-actions">
                            {isEditing ? (
                                <>
                                    <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button className="btn-save" onClick={handleSave}>Save Changes</button>
                                </>
                            ) : (
                                <button className="btn-edit" onClick={() => setIsEditing(true)}>Edit Profile</button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="profile-content-grid">
                    <div className="profile-sidebar">
                        <button
                            className={`sidebar-link ${activeSection === 'shop' ? 'active' : ''}`}
                            onClick={() => setActiveSection('shop')}
                        >
                            🏬 Shop Details
                        </button>
                        <button
                            className={`sidebar-link ${activeSection === 'business' ? 'active' : ''}`}
                            onClick={() => setActiveSection('business')}
                        >
                            💼 Business Info
                        </button>
                        <button
                            className={`sidebar-link ${activeSection === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveSection('settings')}
                        >
                            ⚙️ Settings
                        </button>
                    </div>

                    <div className="profile-main">
                        {activeSection === 'shop' && (
                            <div className="profile-section">
                                <h2>Shop Information</h2>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Shop Name</label>
                                        <input
                                            type="text"
                                            value={shopData.shopName}
                                            disabled={!isEditing}
                                            onChange={(e) => setShopData({ ...shopData, shopName: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <input
                                            type="text"
                                            value={shopData.category}
                                            disabled={true}
                                            className="disabled-input"
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Description</label>
                                        <textarea
                                            rows="3"
                                            value={shopData.description}
                                            disabled={!isEditing}
                                            onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Contact Number</label>
                                        <input
                                            type="text"
                                            value={shopData.contact}
                                            disabled={!isEditing}
                                            onChange={(e) => setShopData({ ...shopData, contact: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            value={shopData.email}
                                            disabled={!isEditing}
                                            onChange={(e) => setShopData({ ...shopData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Address</label>
                                        <input
                                            type="text"
                                            value={shopData.address}
                                            disabled={!isEditing}
                                            onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>City</label>
                                        <input
                                            type="text"
                                            value={shopData.city}
                                            disabled={!isEditing}
                                            onChange={(e) => setShopData({ ...shopData, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Pincode</label>
                                        <input
                                            type="text"
                                            value={shopData.pincode}
                                            disabled={!isEditing}
                                            onChange={(e) => setShopData({ ...shopData, pincode: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'business' && (
                            <div className="profile-section">
                                <h2>Business & Legal</h2>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Owner Name</label>
                                        <input
                                            type="text"
                                            value={shopData.ownerName}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>GSTIN</label>
                                        <input
                                            type="text"
                                            value={shopData.gstin}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>FSSAI License</label>
                                        <input
                                            type="text"
                                            value={shopData.fssai}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'settings' && (
                            <div className="profile-section">
                                <h2>Store Settings</h2>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Opening Time</label>
                                        <input
                                            type="time"
                                            value={shopData.openingTime}
                                            disabled={!isEditing}
                                            onChange={(e) => setShopData({ ...shopData, openingTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Closing Time</label>
                                        <input
                                            type="time"
                                            value={shopData.closingTime}
                                            disabled={!isEditing}
                                            onChange={(e) => setShopData({ ...shopData, closingTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label className="toggle-label">
                                            Store Status
                                            <div className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={shopData.isOpen}
                                                    disabled={!isEditing}
                                                    onChange={(e) => setShopData({ ...shopData, isOpen: e.target.checked })}
                                                />
                                                <span className="slider round"></span>
                                            </div>
                                            <span className="status-text">{shopData.isOpen ? 'Open for Orders' : 'Temporarily Closed'}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
