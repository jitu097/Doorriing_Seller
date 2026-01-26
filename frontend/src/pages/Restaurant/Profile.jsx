import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './Profile.css';
import apiCall from '../../services/api';

export default function Profile() {
	const [formData, setFormData] = useState({});
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetchShopData();
	}, []);

	const fetchShopData = async () => {
		try {
			setLoading(true);
			// Fetch profile data ONLY from /api/shop as requested
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

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			setSaving(true);
			// PUT /api/shop to update shop profile
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
		return (
			<>
				<Navbar />
				<div className="profile-container">
					<div className="loading">Loading profile...</div>
				</div>
			</>
		);
	}

	return (
		<>
			<Navbar />
			<div className="profile-container">
				<div className="profile-header">
					<h1>Restaurant Profile</h1>
					{!isEditing && (
						<button
							className="edit-btn"
							onClick={() => setIsEditing(true)}
						>
							Edit Profile
						</button>
					)}
				</div>

				<form onSubmit={handleSubmit} className="profile-form">
					{/* Basic Info */}
					<div className="profile-section">
						<h2>🏠 Basic Information</h2>
						<div className="info-grid">
							<div className="info-item">
								<label>Shop Name</label>
								{isEditing ? (
									<input
										type="text"
										name="shop_name"
										value={formData.shop_name || ''}
										onChange={handleInputChange}
										required
									/>
								) : (
									<p>{formData.shop_name}</p>
								)}
							</div>
							<div className="info-item">
								<label>Owner Name</label>
								{isEditing ? (
									<input
										type="text"
										name="owner_name"
										value={formData.owner_name || ''}
										onChange={handleInputChange}
										required
									/>
								) : (
									<p>{formData.owner_name}</p>
								)}
							</div>
							<div className="info-item">
								<label>Email</label>
								{/* Email is usually read-only or requires verify, treating as read-only editable based on instructions to not reference user email columns, but mapping from shop table */}
								{isEditing ? (
									<input
										type="email"
										name="email"
										value={formData.email || ''}
										onChange={handleInputChange}
										required
									/>
								) : (
									<p>{formData.email}</p>
								)}
							</div>
							<div className="info-item">
								<label>Phone</label>
								{isEditing ? (
									<input
										type="tel"
										name="phone"
										value={formData.phone || ''}
										onChange={handleInputChange}
										required
									/>
								) : (
									<p>{formData.phone}</p>
								)}
							</div>
						</div>
					</div>

					{/* Address Info */}
					<div className="profile-section">
						<h2>📍 Address Details</h2>
						<div className="info-grid">
							<div className="info-item full-width">
								<label>Full Address</label>
								{isEditing ? (
									<textarea
										name="address"
										value={formData.address || ''}
										onChange={handleInputChange}
										rows="2"
										required
									/>
								) : (
									<p>{formData.address}</p>
								)}
							</div>
							<div className="info-item">
								<label>City</label>
								{isEditing ? (
									<input
										type="text"
										name="city"
										value={formData.city || ''}
										onChange={handleInputChange}
										required
									/>
								) : (
									<p>{formData.city}</p>
								)}
							</div>
							<div className="info-item">
								<label>State</label>
								{isEditing ? (
									<input
										type="text"
										name="state"
										value={formData.state || ''}
										onChange={handleInputChange}
										required
									/>
								) : (
									<p>{formData.state}</p>
								)}
							</div>
							<div className="info-item">
								<label>Pincode</label>
								{isEditing ? (
									<input
										type="text"
										name="pincode"
										value={formData.pincode || ''}
										onChange={handleInputChange}
										required
									/>
								) : (
									<p>{formData.pincode}</p>
								)}
							</div>
						</div>
					</div>

					{/* Operating Hours & Status */}
					<div className="profile-section">
						<h2>🕒 Operations</h2>
						<div className="info-grid">
							<div className="info-item">
								<label>Opening Time</label>
								{isEditing ? (
									<input
										type="time"
										name="opening_time"
										value={formData.opening_time || ''}
										onChange={handleInputChange}
									/>
								) : (
									<p>{formData.opening_time || 'N/A'}</p>
								)}
							</div>
							<div className="info-item">
								<label>Closing Time</label>
								{isEditing ? (
									<input
										type="time"
										name="closing_time"
										value={formData.closing_time || ''}
										onChange={handleInputChange}
									/>
								) : (
									<p>{formData.closing_time || 'N/A'}</p>
								)}
							</div>
							<div className="info-item">
								<label>Current Status</label>
								<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
									<p className={formData.is_open ? 'status-open' : 'status-closed'}>
										{formData.is_open ? '🟢 OPEN' : '🔴 CLOSED'}
									</p>
									{!isEditing && (
										<button
											type="button"
											className="btn-toggle-status"
											onClick={handleToggleStatus}
										>
											{formData.is_open ? 'Close Shop' : 'Open Shop'}
										</button>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Delivery Settings */}
					<div className="profile-section">
						<h2>🚚 Delivery Settings</h2>
						<div className="info-grid">
							<div className="info-item">
								<label>Delivery Enabled</label>
								{isEditing ? (
									<div className="checkbox-wrapper">
										<input
											type="checkbox"
											name="delivery_enabled"
											checked={formData.delivery_enabled || false}
											onChange={handleInputChange}
										/>
										<span>Enable Delivery</span>
									</div>
								) : (
									<p className={formData.delivery_enabled ? 'status-enabled' : 'status-disabled'}>
										{formData.delivery_enabled ? '✅ Enabled' : '❌ Disabled'}
									</p>
								)}
							</div>
							<div className="info-item">
								<label>Delivery Charge (₹)</label>
								{isEditing ? (
									<input
										type="number"
										name="delivery_charge"
										value={formData.delivery_charge || ''}
										onChange={handleInputChange}
										min="0"
									/>
								) : (
									<p>₹{formData.delivery_charge || 0}</p>
								)}
							</div>
							<div className="info-item">
								<label>Min Order Amount (₹)</label>
								{isEditing ? (
									<input
										type="number"
										name="min_order_amount"
										value={formData.min_order_amount || ''}
										onChange={handleInputChange}
										min="0"
									/>
								) : (
									<p>₹{formData.min_order_amount || 0}</p>
								)}
							</div>
						</div>
					</div>

					{/* Shop Description */}
					<div className="profile-section">
						<h2>📝 Description</h2>
						{isEditing ? (
							<textarea
								name="description"
								value={formData.description || ''}
								onChange={handleInputChange}
								rows="4"
								className="full-width-textarea"
							/>
						) : (
							<p className="description-text">{formData.description || 'No description available'}</p>
						)}
					</div>

					{/* Stats (Read Only) */}
					{!isEditing && (
						<div className="profile-section">
							<h2>📊 Statistics</h2>
							<div className="stats-grid">
								<div className="stat-box">
									<div className="stat-icon">⭐</div>
									<div>
										<p className="stat-label">Rating</p>
										<p className="stat-value">{formData.rating || 0} / 5.0</p>
									</div>
								</div>
								<div className="stat-box">
									<div className="stat-icon">💬</div>
									<div>
										<p className="stat-label">Reviews</p>
										<p className="stat-value">{formData.total_reviews || 0}</p>
									</div>
								</div>
								<div className="stat-box">
									<div className="stat-icon">📦</div>
									<div>
										<p className="stat-label">Orders</p>
										<p className="stat-value">{formData.total_orders || 0}</p>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Actions */}
					{isEditing && (
						<div className="form-actions">
							<button
								type="button"
								className="cancel-btn"
								onClick={() => {
									setIsEditing(false);
									fetchShopData(); // Reset form data
								}}
								disabled={saving}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="save-btn"
								disabled={saving}
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					)}
				</form>
			</div>
		</>
	);
}
