import React, { useState, useEffect } from 'react';
import './Profile.css';
import apiCall from '../../services/api';
import { shopService } from '../../services/shopService';

export default function Profile() {
	const [formData, setFormData] = useState({});
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [uploadingImage, setUploadingImage] = useState(false);
	const [activeSection, setActiveSection] = useState('shop');
	const [selectedImageFile, setSelectedImageFile] = useState(null);
	const [previewImage, setPreviewImage] = useState('');

	const isShopOpen = (shop) => {
		if (shop?.status) return String(shop.status).toLowerCase() === 'open';
		return !!shop?.is_open;
	};

	useEffect(() => {
		fetchShopData();
		const unsubscribe = shopService.subscribeToShopStatus((isOpen) => {
			setFormData(prev => ({ ...prev, is_open: isOpen, status: isOpen ? 'open' : 'closed' }));
		});
		return () => {
			if (previewImage) {
				URL.revokeObjectURL(previewImage);
			}
			unsubscribe();
		};
	}, []);

	const fetchShopData = async () => {
		try {
			setLoading(true);
			const response = await apiCall('/shop');
			const shop = response.shop || {};
			const open = isShopOpen(shop);
			setFormData({
				...shop,
				status: shop.status || (open ? 'open' : 'closed'),
				is_open: open
			});
		} catch (error) {
			console.error('Failed to fetch shop data:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value
		}));
	};

	const handleSubmit = async () => {
		try {
			setSaving(true);
			await apiCall('/shop', {
				method: 'PATCH',
				body: JSON.stringify({
					...formData,
					status: isShopOpen(formData) ? 'open' : 'closed'
				})
			});

			await fetchShopData();
			setIsEditing(false);
			alert('Shop profile updated successfully');
		} catch (error) {
			console.error('Failed to update shop:', error);
			alert('Failed to update shop profile');
		} finally {
			setSaving(false);
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

	const clearImageSelection = () => {
		if (previewImage) {
			URL.revokeObjectURL(previewImage);
		}
		setPreviewImage('');
		setSelectedImageFile(null);
	};

	const handleSaveShopImage = async () => {
		if (!selectedImageFile) {
			alert('Please select an image first');
			return;
		}

		try {
			setUploadingImage(true);
			const updatedShop = await shopService.uploadShopImage(selectedImageFile);
			setFormData(prev => ({
				...prev,
				shop_image_url: updatedShop?.shop_image_url || prev.shop_image_url
			}));
			clearImageSelection();
			alert('Shop image uploaded successfully');
		} catch (error) {
			console.error('Failed to upload shop image:', error);
			alert('Failed to upload shop image');
		} finally {
			setUploadingImage(false);
		}
	};

	if (loading) {
		return <div className="loading-container">Loading Profile...</div>;
	}

	return (
		<div className="admin-container">
			<div className="profile-header-card">
				<div className="profile-cover" style={{ 
					backgroundImage: (previewImage || formData.shop_image_url)
						? `url(${previewImage || formData.shop_image_url})`
						: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					backgroundSize: 'cover',
					backgroundPosition: 'center'
				}}>
					<input id="restaurant-cover-image" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} style={{ display: 'none' }} />
					<button
						type="button"
						className="edit-cover-btn"
						onClick={() => document.getElementById('restaurant-cover-image')?.click()}
						disabled={uploadingImage || saving}
					>
						📷 {previewImage || formData.shop_image_url ? 'Change Shop Image' : 'Upload Shop Image'}
					</button>
					{selectedImageFile && (
						<button
							type="button"
							className="edit-cover-btn"
							onClick={handleSaveShopImage}
							disabled={uploadingImage || saving}
							style={{ marginTop: '0.5rem' }}
						>
							{uploadingImage ? 'Uploading...' : 'Upload & Save Image'}
						</button>
					)}
				</div>
				<div className="profile-info-bar">
					<div className="profile-avatar">
					<img src={formData.shop_name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.shop_name)}&background=FF6B6B&color=fff&size=128` : 'https://ui-avatars.com/api/?name=Restaurant&background=FF6B6B&color=fff&size=128'} alt="Shop Logo" />
					</div>
					<div className="profile-basics">
						<h1>{formData.shop_name || 'Restaurant Name'}</h1>
						<p className="profile-category">{formData.subcategory || 'Restaurant'}</p>
						<p className="profile-location">📍 {formData.city || 'City'}</p>
					</div>
					<div className="profile-actions">
						{isEditing ? (
							<>
								<button className="btn-cancel" onClick={() => { setIsEditing(false); fetchShopData(); }} disabled={saving}>Cancel</button>
								<button className="btn-save" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
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
						🏠 Basic Info
					</button>
					<button
						className={`sidebar-link ${activeSection === 'address' ? 'active' : ''}`}
						onClick={() => setActiveSection('address')}
					>
						📍 Address
					</button>
					<button
						className={`sidebar-link ${activeSection === 'settings' ? 'active' : ''}`}
						onClick={() => setActiveSection('settings')}
					>
						⚙️ Settings & Ops
					</button>
				</div>

				<div className="profile-main">
					{activeSection === 'shop' && (
						<div className="profile-section">
							<h2>Basic Information</h2>
							<div className="form-grid">
								<div className="form-group">
									<label>Shop Name</label>
									<input
										type="text"
										name="shop_name"
										value={formData.shop_name || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group">
									<label>Owner Name</label>
									<input
										type="text"
										name="owner_name"
										value={formData.owner_name || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group">
									<label>Email</label>
									<input
										type="email"
										name="email"
										value={formData.email || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group">
									<label>Phone</label>
									<input
										type="tel"
										name="phone"
										value={formData.phone || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group full-width">
									<label>Description</label>
									<textarea
										name="description"
										rows="3"
										value={formData.description || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
							</div>
						</div>
					)}

					{activeSection === 'address' && (
						<div className="profile-section">
							<h2>Address Details</h2>
							<div className="form-grid">
								<div className="form-group full-width">
									<label>Full Address</label>
									<input
										type="text"
										name="address"
										value={formData.address || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group">
									<label>City</label>
									<input
										type="text"
										name="city"
										value={formData.city || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group">
									<label>State</label>
									<input
										type="text"
										name="state"
										value={formData.state || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group">
									<label>Pincode</label>
									<input
										type="text"
										name="pincode"
										value={formData.pincode || ''}
										onChange={handleInputChange}
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
										name="opening_time"
										value={formData.opening_time || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group">
									<label>Closing Time</label>
									<input
										type="time"
										name="closing_time"
										value={formData.closing_time || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group full-width">
									<label className="toggle-label">
										Shop Status
										<div className="toggle-switch">
											<input
												type="checkbox"
													checked={isShopOpen(formData)}
												disabled={true}
											/>
											<span className="slider round"></span>
										</div>
											<span className="status-text">{isShopOpen(formData) ? 'Open for Orders' : 'Temporarily Closed'}</span>
									</label>
									<p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Shop status is controlled from the top Admin Panel toggle.</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
