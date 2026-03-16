
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
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [showTermsModal, setShowTermsModal] = useState(false);

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

		// Validate Terms acceptance
		if (!termsAccepted) {
			alert('You must accept the Terms & Conditions to register.');
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
			payload.append('termsAccepted', 'true');
			payload.append('terms_version', 'v1');

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
				<div className="register-card">
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
							{/* Terms & Conditions Checkbox */}
							<div className="register-terms-section">
								<label className="register-terms-label">
									<input
										type="checkbox"
										checked={termsAccepted}
										onChange={(e) => setTermsAccepted(e.target.checked)}
										className="register-terms-checkbox"
										required
									/>
									<span className="register-terms-text">
										I agree to the{' '}
										<button
											type="button"
											className="register-terms-link"
											onClick={() => setShowTermsModal(true)}
										>
											Terms & Conditions
										</button>
									</span>
								</label>
							</div>
							{/* Submit Button */}
							<div className="register-submit-section">
								<div className="register-submit-row">
									<button type="button" className="register-cancel-link" onClick={() => navigate('/')}>Cancel</button>
									<button
										type="submit"
										disabled={isSubmitting || !termsAccepted}
										className={`register-submit-button ${isSubmitting ? 'register-loading' : ''} ${!termsAccepted ? 'register-submit-disabled' : ''}`}
										title={!termsAccepted ? 'Please accept the Terms & Conditions to continue' : ''}
									>
										{isSubmitting ? 'Registering...' : 'Register Shop'}
									</button>
								</div>
							</div>
						</form>
					</div>
				</div>
			</div>
			<style>{`.register-input-disabled { background-color: #f0f0f0; cursor: not-allowed; color: #555; }`}</style>

			{/* Terms & Conditions Modal */}
			{showTermsModal && (
				<div className="terms-modal-overlay" onClick={() => setShowTermsModal(false)}>
					<div className="terms-modal" onClick={(e) => e.stopPropagation()}>
						<div className="terms-modal-header">
							<h2 className="terms-modal-title">Terms & Conditions</h2>
							<button className="terms-modal-close" onClick={() => setShowTermsModal(false)} aria-label="Close">✕</button>
						</div>
						<div className="terms-modal-body">
							<p className="terms-modal-meta">Last updated: March 2026 · Version 1.0</p>

							<h3>1. Introduction</h3>
							<p>Welcome to <strong>Doorriing</strong>. By registering as a seller, you agree to be bound by these Terms & Conditions. Please read them carefully before completing your registration.</p>

							<h3>2. Seller Eligibility</h3>
							<p>To register as a seller on Doorriing, you must:</p>
							<ul>
								<li>Be at least 18 years of age.</li>
								<li>Operate a legitimate business registered in India.</li>
								<li>Hold a valid PAN card and Aadhaar number.</li>
								<li>Agree to conduct business in compliance with all applicable Indian laws.</li>
							</ul>

							<h3>3. Seller Responsibilities</h3>
							<p>As a registered seller, you agree to:</p>
							<ul>
								<li>Provide accurate and up-to-date information about your shop and products.</li>
								<li>Maintain sufficient inventory to fulfil customer orders.</li>
								<li>Fulfill orders in a timely manner as per the platform's delivery standards.</li>
								<li>Not list any prohibited, illegal, or counterfeit products.</li>
							</ul>

							<h3>4. Payments & Wallet</h3>
							<p>Earnings from fulfilled orders are credited to your wallet automatically. Withdrawals are subject to the platform's payout schedule. Doorriing reserves the right to withhold payments in cases of suspected fraud or policy violation.</p>

							<h3>5. Product Listings</h3>
							<p>All product listings must accurately represent the items being sold. Misleading descriptions or misrepresented products may result in suspension of your account. Doorriing reserves the right to remove any listing that violates community standards.</p>

							<h3>6. Account Suspension & Termination</h3>
							<p>Doorriing reserves the right to suspend or permanently terminate seller accounts that violate these Terms or engage in fraudulent activity. You will be notified via registered email in case of suspension.</p>

							<h3>7. Data & Privacy</h3>
							<p>By registering, you consent to the collection and processing of your personal and business data. Your data will not be sold to third parties. We use your information to operate the platform, process transactions, and improve our services.</p>

							<h3>8. Commission & Fees</h3>
							<p>Doorriing may charge a commission on orders fulfilled through the platform. Any applicable commission rates will be communicated to sellers in advance. The current launch phase operates with zero commission — subject to change with 30 days prior notice.</p>

							<h3>9. Changes to Terms</h3>
							<p>We may update these Terms from time to time. Sellers will be notified of significant changes via in-app notifications and email.</p>

							<h3>10. Governing Law</h3>
							<p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Jharkhand, India.</p>

							<h3>11. Contact Us</h3>
							<p>For questions, contact us at <strong>support@doorriing.com</strong>.</p>
						</div>
						<div className="terms-modal-footer">
							<button
								type="button"
								className="terms-modal-accept-btn"
								onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }}
							>
								I Accept
							</button>
							<button
								type="button"
								className="terms-modal-close-btn"
								onClick={() => setShowTermsModal(false)}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

