
import React, { useState, useEffect } from 'react';
import './Profile.css';
import groceryService from '../../services/groceryService';

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeSection, setActiveSection] = useState('shop');
    const [loading, setLoading] = useState(true);

    const [shopData, setShopData] = useState({
        shopName: '',
        description: '',
        address: '',
        city: '',
        pincode: '',
        contact: '',
        email: '',
        gstin: '',
        fssai: '',
        ownerName: '',
        category: '',
        openingTime: '',
        closingTime: '',
        isOpen: false
    });

    // Helper to ensure we never render an object
    const ensureString = (val) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val); // Fallback debug
        return String(val);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await groceryService.getShopProfile();
                const data = response.data?.shop || response.shop || {};
                const userData = response.data?.user || response.user || {};

                // Use optional chaining and OR checks to ensure primitives
                setShopData({
                    shopName: ensureString(data.shop_name),
                    description: ensureString(data.description),
                    address: ensureString(data.address),
                    city: ensureString(data.city),
                    pincode: ensureString(data.pincode),
                    contact: ensureString(data.phone || userData.phone),
                    email: ensureString(data.email || userData.email),
                    gstin: ensureString(data.tax_id),
                    fssai: ensureString(data.business_license),
                    ownerName: ensureString(data.owner_name || userData.owner_name),
                    category: ensureString(data.subcategory || data.category),
                    openingTime: ensureString(data.operating_hours?.monday?.open || '09:00'),
                    closingTime: ensureString(data.operating_hours?.monday?.close || '21:00'),
                    isOpen: !!data.is_open // Force boolean
                });
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSave = async () => {
        try {
            const updates = {
                shop_name: shopData.shopName,
                description: shopData.description,
                address: shopData.address,
                phone: shopData.contact,
                email: shopData.email,
                city: shopData.city,
                pincode: shopData.pincode
            };

            await groceryService.updateShopProfile(updates);

            // Note: Toggle isOpen might need separate API call if not handled by update
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile: " + error.message);
        }
    };

    if (loading) return <div>Loading Profile...</div>;

    return (
        <>
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
                                            onChange={(e) => setShopData({ ...shopData, gstin: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>FSSAI License</label>
                                        <input
                                            type="text"
                                            value={shopData.fssai}
                                            disabled={!isEditing}
                                            onChange={(e) => setShopData({ ...shopData, fssai: e.target.value })}
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
                                                    disabled={true}
                                                />
                                                <span className="slider round"></span>
                                            </div>
                                            <span className="status-text">{shopData.isOpen ? 'Open for Orders' : 'Temporarily Closed'}</span>
                                        </label>
                                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>To toggle store status, use the main dashboard toggle (if available) or contact support.</p>
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
