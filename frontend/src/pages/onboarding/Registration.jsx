
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopService } from '../../services/shopService';
import './Registration.css';

export default function Registration() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		shopName: '',
		ownerName: '',
		email: '',
		phone: '',
		address: '',
		city: 'Latehar',
		state: 'Jharkhand',
		PINCode: '829206',
		category: '',
		subcategory: '',
		description: '',
		website: '',
		businessLicense: '',
		taxId: '',
		panCard: '',
		aadhaarNumber: '',
		shopPhoto: null
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [photoPreview, setPhotoPreview] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isExistingShop, setIsExistingShop] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	const categories = [
		'Grocery',
		'Restaurant'
	];
	const subcategories = {
		'Grocery': [
			'Vegetable Shop',
			'Fruit Shop',
			'Electronics Groceries',
			'Cosmetics',
			'General Store',
			'Dairy Products',
			'Others'
		],
		'Restaurant': [
			'Restaurant',
			'Sweet Store',
			'Dhaba',
			'Fast Food',
			'Cafe',
			'Bakery',
			'Others'
		]
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		if (name === 'category') {
			setFormData(prev => ({ ...prev, [name]: value, subcategory: '' }));
			// Store category selection for routing after registration
			localStorage.setItem('selectedCategory', value);
			return;
		}
		if (name === 'panCard') {
			setFormData(prev => ({ ...prev, [name]: value.toUpperCase().replace(/[^A-Z0-9]/g, '') }));
			return;
		}
		if (name === 'aadhaarNumber') {
			setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
			return;
		}
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handlePhotoChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			// Validate file type
			const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!validTypes.includes(file.type)) {
				alert('Please select a valid image file (JPEG, PNG, or WebP)');
				return;
			}
			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert('Image size must be less than 5MB');
				return;
			}
			setFormData(prev => ({ ...prev, shopPhoto: file }));
			const reader = new FileReader();
			reader.onload = (e) => {
				setPhotoPreview(e.target.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const removePhoto = () => {
		setFormData(prev => ({ ...prev, shopPhoto: null }));
		setPhotoPreview(null);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);

		// Validate PAN
		const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
		if (!panRegex.test(formData.panCard)) {
			alert('Please enter a valid PAN card number (format: ABCDE1234F)');
			setIsSubmitting(false);
			return;
		}

		// Validate Aadhaar
		const aadhaarRegex = /^[0-9]{12}$/;
		if (!aadhaarRegex.test(formData.aadhaarNumber)) {
			alert('Please enter a valid 12-digit Aadhaar number');
			setIsSubmitting(false);
			return;
		}

		// Submit to backend
		try {
			const payload = new FormData();
			payload.append('shop_name', formData.shopName);
			payload.append('owner_name', formData.ownerName);
			payload.append('phone', formData.phone);
			payload.append('email', formData.email);
			payload.append('address', formData.address);
			payload.append('category', formData.category);
			payload.append('subcategory', formData.subcategory);
			payload.append('description', formData.description || '');
			payload.append('city', formData.city);
			payload.append('state', formData.state);
			payload.append('pincode', formData.PINCode);

			if (formData.shopPhoto) {
				payload.append('image', formData.shopPhoto);
			}

			// Call API to create shop
			await shopService.createShop(payload);

			// Determine route
			const category = formData.category.toLowerCase();
			const dashboardRoutes = {
				grocery: '/grocery/dashboard',
				restaurant: '/restaurant/dashboard'
			};
			const targetRoute = dashboardRoutes[category] || '/dashboard';

			// Success Popup Logic
			const popup = document.createElement('div');
			popup.style.cssText = `
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: white;
				padding: 40px;
				border-radius: 16px;
				box-shadow: 0 20px 60px rgba(0,0,0,0.3);
				z-index: 10000;
				display: flex;
				flex-direction: column;
				align-items: center;
				min-width: 320px;
				font-family: 'Outfit', sans-serif;
			`;

			popup.innerHTML = `
				<div style="font-size: 60px; margin-bottom: 16px; animation: bounce 1s infinite;">🎉</div>
				<h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px;">Success!</h2>
				<p style="margin: 8px 0 24px 0; color: #6b7280; font-size: 16px;">Shop created successfully.</p>
				<div style="width: 100%; text-align: center; color: #f59e0b; font-weight: 500;">
					Taking you to Dashboard...
				</div>
			`;

			const overlay = document.createElement('div');
			overlay.style.cssText = `
				position: fixed;
				inset: 0;
				background: rgba(0,0,0,0.5);
				backdrop-filter: blur(4px);
				z-index: 9999;
			`;

			document.body.appendChild(overlay);
			document.body.appendChild(popup);

			// Navigate after delay
			setTimeout(() => {
				navigate(targetRoute, { replace: true });
				// Cleanup elements after navigation
				setTimeout(() => {
					if (document.body.contains(popup)) document.body.removeChild(popup);
					if (document.body.contains(overlay)) document.body.removeChild(overlay);
				}, 500);
			}, 2500);

		} catch (error) {
			console.error('Registration failed:', error);
			alert('Failed to register shop. Please try again. ' + (error.message || ''));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="register-container">
			<header className="register-header">
				<div className="register-header-content">
					<div className="register-header-inner">
						<div className="register-header-left">
							<h1 className="register-title">Shop Registration</h1>
						</div>
					</div>
				</div>
			</header>
			<div className="register-main">
				{isLoading ? (
					<div style={{ textAlign: 'center', padding: '50px' }}>
						<p>Loading shop data...</p>
					</div>
				) : (
					<div className="register-card">
						{successMessage && (
							<div style={{
								padding: '16px',
								marginBottom: '20px',
								backgroundColor: '#4caf50',
								color: 'white',
								borderRadius: '8px',
								textAlign: 'center',
								fontWeight: '500',
								fontSize: '1rem',
								animation: 'slideIn 0.3s ease-out'
							}}>
								{successMessage}
							</div>
						)}
						<form onSubmit={handleSubmit} className="register-form">
							{/* Basic Information */}
							<div className="register-section">
								<h3 className="register-section-title">Basic Information</h3>
								<div className="register-grid-2">
									<div className="register-form-group">
										<label className="register-label">Shop Name *</label>
										<input type="text" name="shopName" value={formData.shopName} onChange={handleInputChange} required className="register-input" placeholder="Enter your shop name" />
									</div>
									<div className="register-form-group">
										<label className="register-label">Owner Name *</label>
										<input type="text" name="ownerName" value={formData.ownerName} onChange={handleInputChange} required className="register-input" placeholder="Enter owner's full name" />
									</div>
									<div className="register-form-group">
										<label className="register-label">Email *</label>
										<input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="register-input" placeholder="Enter email address" />
									</div>
									<div className="register-form-group">
										<label className="register-label">Phone *</label>
										<input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="register-input" placeholder="Enter phone number" />
									</div>
									<div className="register-form-group">
										<label className="register-label">Category *</label>
										<select name="category" value={formData.category} onChange={handleInputChange} required className="register-select">
											<option value="">Select a category</option>
											{categories.map(category => (
												<option key={category} value={category}>{category}</option>
											))}
										</select>
									</div>
									<div className="register-form-group">
										<label className="register-label">Sub Category *</label>
										<select name="subcategory" value={formData.subcategory} onChange={handleInputChange} required disabled={!formData.category} className={`register-select ${!formData.category ? 'register-input-disabled' : ''}`}>
											<option value="">Select a sub category</option>
											{formData.category && subcategories[formData.category]?.map(subcat => (
												<option key={subcat} value={subcat}>{subcat}</option>
											))}
										</select>
									</div>
									<div className="register-form-group register-grid-span-2">
										<label className="register-label">Description</label>
										<textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="register-textarea" placeholder="Describe your shop and what you sell" />
									</div>
									<div className="register-form-group register-grid-span-2">
										<label className="register-label">Shop Photo</label>
										<div className="photo-upload-container">
											{!photoPreview ? (
												<div>
													<input type="file" id="shopPhoto" name="shopPhoto" accept="image/*" onChange={handlePhotoChange} className="photo-upload-input" />
													<label htmlFor="shopPhoto" className="photo-upload-label">
														<div className="photo-upload-icon">
															<svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
															</svg>
														</div>
														<div className="photo-upload-text">Click to upload shop photo</div>
														<div className="photo-upload-subtext">PNG, JPG, WebP up to 5MB</div>
													</label>
												</div>
											) : (
												<div>
													<img src={photoPreview} alt="Shop preview" className="photo-preview" />
													<button type="button" onClick={removePhoto} className="register-submit-button" style={{ marginTop: '1rem', background: '#ef4444' }}>Remove Photo</button>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
							{/* Address Information */}
							<div className="register-section">
								<h3 className="register-section-title">Address Information</h3>
								<div className="register-grid-2">
									<div className="register-form-group register-grid-span-2">
										<label className="register-label">Street Address *</label>
										<input type="text" name="address" value={formData.address} onChange={handleInputChange} required className="register-input" placeholder="Enter street address" />
									</div>
									<div className="register-form-group">
										<label className="register-label">City *</label>
										<input type="text" name="city" value="Latehar" readOnly required className="register-input register-input-disabled" placeholder="City is fixed to Latehar" />
									</div>
									<div className="register-form-group">
										<label className="register-label">State *</label>
										<input type="text" name="state" value="Jharkhand" readOnly required className="register-input register-input-disabled" placeholder="State is fixed to Jharkhand" />
									</div>
									<div className="register-form-group">
										<label className="register-label">PIN Code *</label>
										<input type="text" name="PINCode" value="829206" readOnly required className="register-input register-input-disabled" placeholder="PIN code is fixed to 829206" />
									</div>
								</div>
							</div>
							{/* Business Information */}
							<div className="register-section">
								<h3 className="register-section-title">Business Information</h3>
								<div className="register-grid-2">
									<div className="register-form-group">
										<label className="register-label">PAN Card Number *</label>
										<input type="text" name="panCard" value={formData.panCard} onChange={handleInputChange} required className="register-input" placeholder="Enter PAN card number (e.g., ABCDE1234F)" maxLength="10" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" title="PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)" />
									</div>
									<div className="register-form-group">
										<label className="register-label">Aadhaar Number *</label>
										<input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleInputChange} required className="register-input" placeholder="Enter 12-digit Aadhaar number" maxLength="12" pattern="[0-9]{12}" title="Aadhaar should be 12 digits" />
									</div>
									<div className="register-form-group">
										<label className="register-label">Business License Number</label>
										<input type="text" name="businessLicense" value={formData.businessLicense} onChange={handleInputChange} className="register-input" placeholder="Enter license number" />
									</div>
									<div className="register-form-group">
										<label className="register-label">Tax ID</label>
										<input type="text" name="taxId" value={formData.taxId} onChange={handleInputChange} className="register-input" placeholder="Enter tax ID" />
									</div>
								</div>
							</div>
							{/* Submit Button */}
							<div className="register-submit-section">
								<div className="register-submit-row">
									<button type="button" className="register-cancel-link" onClick={() => navigate('/')}>Cancel</button>
									<button type="submit" disabled={isSubmitting} className={`register-submit-button ${isSubmitting ? 'register-loading' : ''}`}>
										{isSubmitting ? (isExistingShop ? 'Updating...' : 'Registering...') : (isExistingShop ? 'Update Shop' : 'Register Shop')}
									</button>
								</div>
							</div>
						</form>
					</div>
				)}
			</div>
			<style>{`.register-input-disabled { background-color: #f0f0f0; cursor: not-allowed; color: #555; }`}</style>
		</div>
	);
}

