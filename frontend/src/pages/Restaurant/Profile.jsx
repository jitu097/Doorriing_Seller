import React, { useState, useEffect } from 'react';
import './Profile.css';
import apiCall from '../../services/api';

export default function Profile() {
	const [formData, setFormData] = useState({});
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [activeSection, setActiveSection] = useState('shop');

	useEffect(() => {
		fetchShopData();
	}, []);

	const fetchShopData = async () => {
		try {
			setLoading(true);
			const response = await apiCall('/shop');
			// Backend returns { shop: ..., user: ... }
			setFormData(response.shop || {});
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
				method: 'PUT',
				body: JSON.stringify(formData)
			});
			setIsEditing(false);
			alert('Shop profile updated successfully');
		} catch (error) {
			console.error('Failed to update shop:', error);
			alert('Failed to update shop profile');
		} finally {
			setSaving(false);
		}
	};

	const handleToggleStatus = async () => {
		try {
			const newStatus = !formData.is_open;
			await apiCall('/shop/status', {
				method: 'PATCH',
				body: JSON.stringify({ is_open: newStatus })
			});
			setFormData(prev => ({ ...prev, is_open: newStatus }));
		} catch (error) {
			console.error('Failed to toggle shop status:', error);
			alert('Failed to update shop status');
		}
	};

	if (loading) {
		return <div className="loading-container">Loading Profile...</div>;
	}

	return (
		<div className="admin-container">
			<div className="profile-header-card">
				<div className="profile-cover">
					<button className="edit-cover-btn">📷 Change Cover</button>
				</div>
				<div className="profile-info-bar">
					<div className="profile-avatar">
						<img src="https://ui-avatars.com/api/?name=Restaurant&background=FF6B6B&color=fff&size=128" alt="Shop Logo" />
						<button className="edit-avatar-btn">✏️</button>
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
								<div className="form-group">
									<label>Delivery Charge (₹)</label>
									<input
										type="number"
										name="delivery_charge"
										value={formData.delivery_charge || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group">
									<label>Min Order (₹)</label>
									<input
										type="number"
										name="min_order_amount"
										value={formData.min_order_amount || ''}
										onChange={handleInputChange}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group full-width">
									<label className="toggle-label">
										Delivery Status
										<div className="toggle-switch">
											<input
												type="checkbox"
												name="delivery_enabled"
												checked={formData.delivery_enabled || false}
												onChange={handleInputChange}
												disabled={!isEditing}
											/>
											<span className="slider round"></span>
										</div>
										<span className="status-text">{formData.delivery_enabled ? 'Delivery Enabled' : 'Delivery Disabled'}</span>
									</label>
								</div>
								<div className="form-group full-width">
									<label className="toggle-label">
										Shop Status
										<div className="toggle-switch">
											<input
												type="checkbox"
												checked={formData.is_open || false}
												disabled={true}
											/>
											<span className="slider round"></span>
										</div>
										<span className="status-text">{formData.is_open ? 'Open for Orders' : 'Temporarily Closed'}</span>
									</label>
									{!isEditing && (
										<button className="btn-toggle-status" onClick={handleToggleStatus} style={{ marginTop: '10px' }}>
											{formData.is_open ? 'Close Shop' : 'Open Shop'}
										</button>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
