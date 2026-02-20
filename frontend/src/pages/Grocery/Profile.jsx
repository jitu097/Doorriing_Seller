
import React, { useState, useEffect } from 'react';
import './Profile.css';
import groceryService from '../../services/groceryService';
import { shopService } from '../../services/shopService';

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeSection, setActiveSection] = useState('shop');
    const [loading, setLoading] = useState(true);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState('');

    const [shopData, setShopData] = useState({
        shopName: '',
        description: '',
        address: '',
        city: '',
        pincode: '',
        contact: '',
        gstin: '',
        fssai: '',
        ownerName: '',
        category: '',
        openingTime: '',
        closingTime: '',
        isOpen: false
    });

    const getShopStatus = (data) => {
        if (data?.status) return String(data.status).toLowerCase();
        return data?.is_open ? 'open' : 'closed';
    };

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
                    gstin: ensureString(data.tax_id),
                    fssai: ensureString(data.business_license),
                    ownerName: ensureString(data.owner_name || userData.owner_name),
                    category: ensureString(data.subcategory || data.category),
                    openingTime: ensureString(data.opening_time || data.operating_hours?.monday?.open || '09:00'),
                    closingTime: ensureString(data.closing_time || data.operating_hours?.monday?.close || '21:00'),
                    isOpen: getShopStatus(data) === 'open',
                    imageUrl: ensureString(data.shop_image_url)
                });
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();

        const unsubscribe = shopService.subscribeToShopStatus((isOpen) => {
            setShopData(prev => ({ ...prev, isOpen }));
        });

        return unsubscribe;
    }, []);

    const handleSave = async () => {
        try {
            const updates = {
                shop_name: shopData.shopName,
                description: shopData.description,
                address: shopData.address,
                phone: shopData.contact,
                city: shopData.city,
                pincode: shopData.pincode,
                opening_time: shopData.openingTime || null,
                closing_time: shopData.closingTime || null,
                status: shopData.isOpen ? 'open' : 'closed'
            };

            await groceryService.updateShopProfile(updates);

            if (selectedImageFile) {
                await shopService.uploadShopImage(selectedImageFile);
                setSelectedImageFile(null);
                setPreviewImage('');
            }

            // Image already uploaded via handleImageChange

            // Note: Toggle isOpen might need separate API call if not handled by update
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile: " + error.message);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, or WebP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setSelectedImageFile(file);
        setPreviewImage(URL.createObjectURL(file));
    };

    if (loading) return <div>Loading Profile...</div>;

    return (
        <>
            <div className="admin-container">
                <div className="profile-header-card">
                    <div className="profile-cover" style={{ 
                        backgroundImage: previewImage || shopData.imageUrl ? `url(${previewImage || shopData.imageUrl})` : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}>
                        <input id="grocery-cover-image" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} style={{ display: 'none' }} />
                        <button type="button" className="edit-cover-btn" onClick={() => document.getElementById('grocery-cover-image')?.click()}>
                            📷 {previewImage || shopData.imageUrl ? 'Change Shop Image' : 'Upload Shop Image'}
                        </button>
                    </div>
                    <div className="profile-info-bar">
                        <div className="profile-avatar">
                            <img src={shopData.shopName ? `https://ui-avatars.com/api/?name=${encodeURIComponent(shopData.shopName)}&background=FFA500&color=fff&size=128` : "https://ui-avatars.com/api/?name=Green+Valley&background=FFA500&color=fff&size=128"} alt="Shop Logo" />
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
                                            onChange={(e) => setShopData({ ...shopData, ownerName: e.target.value })}
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
