import React, { useState, useEffect } from 'react';
import './Menu.css';
import './RestaurantItemForm.css';
import MenuItemCard from './MenuItemCard';
import categoryService from '../../services/restaurantCategoryService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import itemService from '../../services/itemService';
import subcategoryService from '../../services/restaurantSubcategoryService';

const FOOD_TYPE = {
	VEG: 'veg',
	NON_VEG: 'nonveg',
};

const OFFER_TYPES = {
	NONE: 'none',
	PERCENTAGE: 'percentage',
	FLAT: 'flat',
};

const OFFER_OPTIONS = [
	{ value: OFFER_TYPES.NONE, label: 'No Offer' },
	{ value: OFFER_TYPES.PERCENTAGE, label: 'Percentage Discount' },
	{ value: OFFER_TYPES.FLAT, label: 'Flat Discount' },
];

const normalizeFoodType = (value) => (
	value?.toLowerCase() === FOOD_TYPE.NON_VEG ? FOOD_TYPE.NON_VEG : FOOD_TYPE.VEG
);

const parseCurrencyInput = (value) => {
	if (value === '' || value === null || typeof value === 'undefined') {
		return 0;
	}
	const parsed = parseFloat(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const clampToZero = (amount) => (amount < 0 ? 0 : amount);

const calculateFinalPrice = (price, discountType, discountValue) => {
	const basePrice = clampToZero(parseCurrencyInput(price));
	const normalizedDiscountValue = clampToZero(parseCurrencyInput(discountValue));
	if (!basePrice) return 0;

	if (discountType === OFFER_TYPES.PERCENTAGE) {
		const percentage = Math.min(normalizedDiscountValue, 100);
		return clampToZero(basePrice - (basePrice * percentage) / 100);
	}

	if (discountType === OFFER_TYPES.FLAT) {
		return clampToZero(basePrice - normalizedDiscountValue);
	}

	return basePrice;
};

const createInitialItemState = () => ({
	name: '',
	description: '',
	category: '',
	subcategory_id: '',
	image: null,
	halfPortion: false,
	fullPrice: '',
	fullDiscountType: OFFER_TYPES.NONE,
	fullDiscountValue: '',
	halfPrice: '',
	halfDiscountType: OFFER_TYPES.NONE,
	halfDiscountValue: '',
	unit: 'plate',
	active: true,
	food_type: FOOD_TYPE.VEG,
});

const Menu = () => {
	const [categories, setCategories] = useState([]);
	const [subcategories, setSubcategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openIndex, setOpenIndex] = useState(null);
	const [items, setItems] = useState([]);

	const [showModal, setShowModal] = useState(false);
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState('');
	const [subcategoriesList, setSubcategoriesList] = useState([]);
	const [newCategory, setNewCategory] = useState('');
	const [newSubcategory, setNewSubcategory] = useState('');
	const [categoryImageFile, setCategoryImageFile] = useState(null);
	const [newItem, setNewItem] = useState(createInitialItemState());
	const [editingItemId, setEditingItemId] = useState(null);
	const fallbackCategoryImage = '/images/category-placeholder.png';

	useRealtimeSubscription('items', () => { setTimeout(fetchCategories, 0) });

	useEffect(() => {
		fetchCategories();
	}, []);

	const fetchCategories = async () => {
		try {
			setLoading(true);
			const data = await categoryService.getCategories();
			setCategories(data || []);
		} catch (error) {
			console.error('Failed to fetch categories:', error);
			// Set empty array on error - backend may not be running
			setCategories([]);
		} finally {
			setLoading(false);
		}
	};

	const handleAccordion = (idx) => {
		setOpenIndex(openIndex === idx ? null : idx);
	};

	const handleInputChange = async (e) => {
		const { name, value, type, checked, files } = e.target;

		if (type === 'checkbox') {
			if (name === 'halfPortion') {
				setNewItem((prev) => ({
					...prev,
					halfPortion: checked,
					halfPrice: checked ? prev.halfPrice : '',
					halfDiscountType: checked ? prev.halfDiscountType : OFFER_TYPES.NONE,
					halfDiscountValue: checked ? prev.halfDiscountValue : '',
				}));
			} else {
				setNewItem((prev) => ({ ...prev, [name]: checked }));
			}
			return;
		}

		if (type === 'file') {
			setNewItem((prev) => ({ ...prev, image: files?.[0] || null }));
			return;
		}

		if (name === 'category') {
			if (value) {
				try {
					const subs = await subcategoryService.getSubcategories(value);
					setSubcategories(subs || []);
					setNewItem((prev) => ({ ...prev, category: value, subcategory_id: '' }));
				} catch (error) {
					console.error('Failed to load subcategories:', error);
					setSubcategories([]);
					setNewItem((prev) => ({ ...prev, category: value }));
				}
			} else {
				setSubcategories([]);
				setNewItem((prev) => ({ ...prev, category: '', subcategory_id: '' }));
			}
			return;
		}

		if (name === 'fullDiscountType') {
			setNewItem((prev) => ({
				...prev,
				fullDiscountType: value,
				fullDiscountValue: value === OFFER_TYPES.NONE ? '' : prev.fullDiscountValue,
			}));
			return;
		}

		if (name === 'halfDiscountType') {
			setNewItem((prev) => ({
				...prev,
				halfDiscountType: value,
				halfDiscountValue: value === OFFER_TYPES.NONE ? '' : prev.halfDiscountValue,
			}));
			return;
		}

		setNewItem((prev) => ({ ...prev, [name]: value }));
	};

	const handleModalClose = () => {
		setShowModal(false);
		setSubcategories([]);
		setEditingItemId(null);
		setNewItem(createInitialItemState());
	};

	const handleQuickAddProduct = async (categoryId) => {
		if (!categoryId) {
			setShowModal(true);
			return;
		}

		try {
			const subs = await subcategoryService.getSubcategories(categoryId);
			setSubcategories(subs || []);
			setNewItem({
				...createInitialItemState(),
				category: categoryId
			});
			setShowModal(true);
		} catch (error) {
			console.error('Failed to prepare quick add:', error);
			setShowModal(true);
		}
	};

	const handleModalOpen = () => {
		setEditingItemId(null);
		setSubcategories([]);
		setNewItem(createInitialItemState());
		setShowModal(true);
	};
	const handleCategoryModalOpen = () => setShowCategoryModal(true);
	const handleCategoryModalClose = () => {
		setShowCategoryModal(false);
		setNewCategory('');
		setCategoryImageFile(null);
	};
	const handleSubcategoryModalOpen = () => setShowSubcategoryModal(true);
	const handleSubcategoryModalClose = () => {
		setShowSubcategoryModal(false);
		setSelectedCategory('');
		setSubcategoriesList([]);
		setNewSubcategory('');
	};

	const handleModalOverlayClick = (event) => {
		if (event.target === event.currentTarget) {
			handleModalClose();
		}
	};

	const handleCategoryImageChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			setCategoryImageFile(e.target.files[0]);
		}
	};

	const handleSaveItem = async (e) => {
		e.preventDefault();

		const fullPrice = clampToZero(parseCurrencyInput(newItem.fullPrice));
		const fullDiscountType = newItem.fullDiscountType || OFFER_TYPES.NONE;
		const rawFullDiscountValue = fullDiscountType === OFFER_TYPES.NONE ? 0 : parseCurrencyInput(newItem.fullDiscountValue);
		const fullFinalPrice = calculateFinalPrice(fullPrice, fullDiscountType, rawFullDiscountValue);

		const hasHalfPortion = newItem.halfPortion && newItem.halfPrice !== '';
		const halfPrice = hasHalfPortion ? clampToZero(parseCurrencyInput(newItem.halfPrice)) : null;
		const halfDiscountType = hasHalfPortion ? newItem.halfDiscountType || OFFER_TYPES.NONE : OFFER_TYPES.NONE;
		const rawHalfDiscountValue = hasHalfPortion && halfDiscountType !== OFFER_TYPES.NONE ? parseCurrencyInput(newItem.halfDiscountValue) : 0;
		const halfFinalPrice = hasHalfPortion ? calculateFinalPrice(halfPrice, halfDiscountType, rawHalfDiscountValue) : null;

		const payload = {
			name: newItem.name,
			description: newItem.description,
			category_id: newItem.category,
			subcategory_id: newItem.subcategory_id || null,
			unit: newItem.unit,
			is_available: newItem.active,
			food_type: normalizeFoodType(newItem.food_type),
			// Full portion fields
			price: fullPrice,
			discount_type: fullDiscountType,
			discount_value: fullDiscountType === OFFER_TYPES.NONE ? 0 : rawFullDiscountValue,
			final_price: fullFinalPrice,
			full_price: fullPrice,
			full_discount_type: fullDiscountType,
			full_discount_value: fullDiscountType === OFFER_TYPES.NONE ? 0 : rawFullDiscountValue,
			full_final_price: fullFinalPrice,
			// Half portion fields
			half_portion_price: hasHalfPortion ? halfPrice : null,
			half_discount_type: hasHalfPortion ? halfDiscountType : OFFER_TYPES.NONE,
			half_discount_value: hasHalfPortion && halfDiscountType !== OFFER_TYPES.NONE ? rawHalfDiscountValue : 0,
			half_portion_final_price: hasHalfPortion ? halfFinalPrice : null,
		};

		try {
			let targetItemId = editingItemId;

			if (editingItemId) {
				await itemService.updateItem(editingItemId, payload);
			} else {
				const created = await itemService.createItem(payload);
				targetItemId = created?.id;
			}

			if (newItem.image && targetItemId) {
				await itemService.uploadItemImage(targetItemId, newItem.image);
			}

			fetchCategories();
			handleModalClose();
		} catch (error) {
			console.error(editingItemId ? 'Failed to update item:' : 'Failed to create item:', error);
			alert(`Failed to ${editingItemId ? 'update' : 'create'} item. Please try again.`);
		}
	};

	const handleAddCategory = async (e) => {
		e.preventDefault();
		if (newCategory.trim()) {
			try {
				await categoryService.createCategory({
					name: newCategory,
					display_order: categories.length
				}, categoryImageFile);
				fetchCategories();
				setNewCategory('');
				setCategoryImageFile(null);
				handleCategoryModalClose();
			} catch (error) {
				console.error('Failed to create category:', error);
				alert('Failed to create category. Please try again.');
			}
		}
	};

	const handleDeleteCategory = async (categoryId) => {
		if (window.confirm('Are you sure you want to delete this category? All items in this category will also be deleted.')) {
			try {
				await categoryService.deleteCategory(categoryId);
				fetchCategories();
			} catch (error) {
				console.error('Failed to delete category:', error);
				alert('Failed to delete category. Please try again.');
			}
		}
	};

	const handleToggleCategory = async (categoryId) => {
		try {
			await categoryService.toggleCategory(categoryId);
			fetchCategories();
		} catch (error) {
			console.error('Failed to toggle category:', error);
			alert('Failed to toggle category. Please try again.');
		}
	};

	const handleToggleItem = async (itemId) => {
		try {
			await itemService.toggleItem(itemId);
			fetchCategories();
		} catch (error) {
			console.error('Failed to toggle item:', error);
			alert('Failed to toggle item. Please try again.');
		}
	};

	const handleDeleteItem = async (itemId) => {
		if (window.confirm('Are you sure you want to delete this item?')) {
			try {
				await itemService.deleteItem(itemId);
				fetchCategories();
			} catch (error) {
				console.error('Failed to delete item:', error);
				alert('Failed to delete item. Please try again.');
			}
		}
	};

	// Subcategory handlers
	const handleCategorySelectChange = async (e) => {
		const catId = e.target.value;
		setSelectedCategory(catId);
		if (catId) {
			try {
				const subs = await subcategoryService.getSubcategories(catId);
				setSubcategoriesList(subs || []);
			} catch (error) {
				console.error('Failed to load subcategories:', error);
				setSubcategoriesList([]);
			}
		} else {
			setSubcategoriesList([]);
		}
	};

	const handleAddSubcategory = async (e) => {
		e.preventDefault();
		if (!selectedCategory) {
			alert('Please select a category first');
			return;
		}
		if (newSubcategory.trim()) {
			try {
				await subcategoryService.createSubcategory({
					name: newSubcategory,
					category_id: selectedCategory
				});
				const subs = await subcategoryService.getSubcategories(selectedCategory);
				setSubcategoriesList(subs || []);
				setNewSubcategory('');
			} catch (error) {
				console.error('Failed to create subcategory:', error);
				alert('Failed to create subcategory. Please try again.');
			}
		}
	};

	const handleDeleteSubcategory = async (subcategoryId) => {
		if (window.confirm('Are you sure you want to delete this subcategory? Items with this subcategory will have it removed.')) {
			try {
				await subcategoryService.deleteSubcategory(subcategoryId);
				const subs = await subcategoryService.getSubcategories(selectedCategory);
				setSubcategoriesList(subs || []);
			} catch (error) {
				console.error('Failed to delete subcategory:', error);
				alert('Failed to delete subcategory. Please try again.');
			}
		}
	};

	const handleToggleSubcategory = async (subcategoryId) => {
		try {
			await subcategoryService.toggleSubcategory(subcategoryId);
			const subs = await subcategoryService.getSubcategories(selectedCategory);
			setSubcategoriesList(subs || []);
		} catch (error) {
			console.error('Failed to toggle subcategory:', error);
			alert('Failed to toggle subcategory. Please try again.');
		}
	};

	const currentFoodType = normalizeFoodType(newItem.food_type);
	const derivedFullPrice = clampToZero(parseCurrencyInput(newItem.fullPrice));
	const derivedFullDiscountValue = newItem.fullDiscountType === OFFER_TYPES.NONE ? 0 : parseCurrencyInput(newItem.fullDiscountValue);
	const derivedFullFinalPrice = calculateFinalPrice(derivedFullPrice, newItem.fullDiscountType, derivedFullDiscountValue);
	const derivedHalfPrice = newItem.halfPortion ? clampToZero(parseCurrencyInput(newItem.halfPrice)) : 0;
	const derivedHalfDiscountValue = newItem.halfPortion && newItem.halfDiscountType !== OFFER_TYPES.NONE ? parseCurrencyInput(newItem.halfDiscountValue) : 0;
	const derivedHalfFinalPrice = newItem.halfPortion ? calculateFinalPrice(derivedHalfPrice, newItem.halfDiscountType, derivedHalfDiscountValue) : 0;

	if (loading) {
		return (
			<>
				<div className="loading">Loading menu...</div>
			</>
		);
	}

	return (
		<>
			<div className="menu-container">
				<div className="menu-header">
					<img src="/MM.png" alt="Manage Menu" className="menu-emoji" style={{ width: '95px', height: '95px', marginRight: '20px', background: 'none', boxShadow: 'none', borderRadius: 0 }} />
					<div>
						<h1 className="menu-title">Manage Menu</h1>
						<div className="menu-overview">
							Overview: <b>{categories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0)} Items</b> | <b>{categories.length} Categories</b>
						</div>
					</div>
				</div>
				<div className="menu-actions">
					<button className="btn btn-outline" onClick={handleCategoryModalOpen}>Manage Categories</button>
					<button className="btn btn-outline" onClick={handleSubcategoryModalOpen}>Manage Subcategories</button>
					<button className="btn btn-primary" onClick={handleModalOpen}>+ Add New Item</button>
				</div>

				<div className="menu-categories">
					{categories.length === 0 ? (
						<div className="no-categories">No categories found. Add a category to get started.</div>
					) : (
						categories.map((cat, idx) => (
							<div className="category-accordion" key={cat.id}>
								<div className="category-header">
									<span className="category-arrow" onClick={() => handleAccordion(idx)}>{openIndex === idx ? '▼' : '▶'}</span>
									<img
										src={cat.image_url || fallbackCategoryImage}
										alt={cat.name}
										loading="lazy"
										style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', marginRight: 4 }}
									/>
									<span className="category-name" onClick={() => handleAccordion(idx)}>{cat.name}</span>
									<span className="category-items">{cat.items?.length || 0} items</span>
									{!cat.is_active && <span className="category-badge hidden" style={{ marginRight: '10px' }}>Hidden</span>}
									<button
										className="category-add-btn"
										onClick={(e) => {
											e.stopPropagation();
											handleQuickAddProduct(cat.id);
										}}
										title={`Add item to ${cat.name}`}
									>
										+
									</button>
								</div>
								{openIndex === idx && (
									<div className="category-content">
										{!cat.items || cat.items.length === 0 ? (
											<div className="empty-items">No items to display.</div>
										) : (
											<div className="item-card-list">
												{cat.items.map((item) => (
													<MenuItemCard
														key={item.id}
														item={item}
														onToggle={handleToggleItem}
														onDelete={handleDeleteItem}
														onEdit={async (item) => {
															// Load subcategories for this category
															if (item.category_id) {
																try {
																	const subs = await subcategoryService.getSubcategories(item.category_id);
																	setSubcategories(subs || []);
																} catch (error) {
																	console.error('Failed to load subcategories:', error);
																	setSubcategories([]);
																}
															}

												const resolvedFullPrice = item.full_price ?? item.price ?? '';
												const resolvedFullDiscountType = item.full_discount_type || item.discount_type || OFFER_TYPES.NONE;
												const resolvedFullDiscountValue = resolvedFullDiscountType === OFFER_TYPES.NONE ? '' : String(item.full_discount_value ?? item.discount_value ?? '');
												const hasHalfPortion = item.half_portion_price !== null && typeof item.half_portion_price !== 'undefined';
												const resolvedHalfDiscountType = item.half_discount_type || OFFER_TYPES.NONE;

												setEditingItemId(item.id);
												setNewItem({
													name: item.name,
													description: item.description || '',
													category: item.category_id || cat.id,
													subcategory_id: item.subcategory_id || '',
													image: null,
													halfPortion: hasHalfPortion,
													fullPrice: resolvedFullPrice !== null && resolvedFullPrice !== undefined ? String(resolvedFullPrice) : '',
													fullDiscountType: resolvedFullDiscountType,
													fullDiscountValue: resolvedFullDiscountValue,
													halfPrice: hasHalfPortion ? String(item.half_portion_price ?? '') : '',
													halfDiscountType: hasHalfPortion ? resolvedHalfDiscountType : OFFER_TYPES.NONE,
													halfDiscountValue: hasHalfPortion && resolvedHalfDiscountType !== OFFER_TYPES.NONE ? String(item.half_discount_value ?? '') : '',
													unit: item.unit || 'plate',
													active: item.is_available,
													food_type: normalizeFoodType(item.food_type)
												});
												setShowModal(true);
														}}
													/>
												))}
											</div>
										)}
									</div>
								)}
							</div>
						))
					)}
				</div>
			</div>

			{/* Modals at the top level */}
			{showModal && (
				<div className="restaurant-form-overlay" onClick={handleModalOverlayClick}>
					<div className="restaurant-form-card">
						<div className="restaurant-form-header">
							<h2>{editingItemId ? 'Edit Item' : 'Add New Item'}</h2>
							<button type="button" className="restaurant-close-btn" onClick={handleModalClose} aria-label="Close item modal">&times;</button>
						</div>
						<div className="restaurant-form-divider"></div>
						<form className="restaurant-form-body" onSubmit={handleSaveItem}>
							<div className="restaurant-form-group">
								<label>Item Name</label>
								<input type="text" name="name" className="restaurant-form-control" placeholder="e.g. Butter Chicken" value={newItem.name} onChange={handleInputChange} required autoFocus />
							</div>
							<div className="restaurant-form-group">
								<label>Description</label>
								<textarea name="description" className="restaurant-form-control restaurant-textarea" placeholder="Short description of the item" value={newItem.description} onChange={handleInputChange} />
							</div>
							<div className="restaurant-form-group">
								<div className="food-type-selector">
									<span className="food-type-label">Food Type</span>
									<div className="food-type-options">
										<label className={`food-type-option veg ${currentFoodType === FOOD_TYPE.VEG ? 'selected' : ''}`}>
											<input type="radio" name="food_type" value={FOOD_TYPE.VEG} checked={currentFoodType === FOOD_TYPE.VEG} onChange={handleInputChange} required />
											<span>🟢 Veg</span>
										</label>
										<label className={`food-type-option nonveg ${currentFoodType === FOOD_TYPE.NON_VEG ? 'selected' : ''}`}>
											<input type="radio" name="food_type" value={FOOD_TYPE.NON_VEG} checked={currentFoodType === FOOD_TYPE.NON_VEG} onChange={handleInputChange} />
											<span>🔴 Non-Veg</span>
										</label>
									</div>
								</div>
							</div>
							<div className="restaurant-form-row">
								<div className="restaurant-form-group restaurant-half-width">
									<label>Category</label>
									<select name="category" className="restaurant-form-control" value={newItem.category} onChange={handleInputChange} required>
										<option value="">Select Category</option>
										{categories.map((cat) => (
											<option key={cat.id} value={cat.id}>{cat.name}</option>
										))}
									</select>
								</div>
								<div className="restaurant-form-group restaurant-half-width">
									<label>Unit</label>
									<select name="unit" className="restaurant-form-control" value={newItem.unit} onChange={handleInputChange} required>
										<option value="plate">Plate</option>
										<option value="piece">Piece</option>
										<option value="kg">Kg</option>
										<option value="gm">Gm</option>
										<option value="ltr">Ltr</option>
										<option value="ml">Ml</option>
									</select>
								</div>
							</div>
							<div className="restaurant-form-group">
								<label>Subcategory (optional)</label>
								<select name="subcategory_id" className="restaurant-form-control" value={newItem.subcategory_id} onChange={handleInputChange}>
									<option value="">None</option>
									{subcategories.filter(sub => sub.is_active).map((sub) => (
										<option key={sub.id} value={sub.id}>{sub.name}</option>
									))}
								</select>
							</div>

							<div className="restaurant-section-card">
								<div className="restaurant-section-header">
									<div>
										<div className="section-title">Full Portion Pricing</div>
										<div className="section-subtitle">Applies to classic/full plate</div>
									</div>
								</div>
								<div className="restaurant-form-row">
									<div className="restaurant-form-group restaurant-half-width">
										<label>Full Price (₹)</label>
										<input type="number" name="fullPrice" className="restaurant-form-control" value={newItem.fullPrice} onChange={handleInputChange} min="0" step="0.01" required />
									</div>
									<div className="restaurant-form-group restaurant-half-width">
										<label>Full Offer Type</label>
										<select name="fullDiscountType" className="restaurant-form-control" value={newItem.fullDiscountType} onChange={handleInputChange}>
											{OFFER_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>{option.label}</option>
											))}
										</select>
									</div>
								</div>
								{newItem.fullDiscountType !== OFFER_TYPES.NONE && (
									<div className="restaurant-form-row">
										<div className="restaurant-form-group restaurant-half-width">
											<label>Full Discount Value</label>
											<input
												type="number"
												name="fullDiscountValue"
												className="restaurant-form-control"
												value={newItem.fullDiscountValue}
												onChange={handleInputChange}
												min="0"
												max={newItem.fullDiscountType === OFFER_TYPES.PERCENTAGE ? 100 : undefined}
												step="0.01"
												required
											/>
										</div>
									</div>
								)}
								<div className="restaurant-price-preview">
									<span className="preview-label">Customer Pays</span>
									<span className="preview-value">₹{derivedFullFinalPrice.toFixed(2)}</span>
								</div>
							</div>

							<div className="restaurant-form-group">
								<label className="restaurant-checkbox-group">
									<input type="checkbox" name="halfPortion" className="restaurant-styled-checkbox" checked={newItem.halfPortion} onChange={handleInputChange} />
									<span className="restaurant-checkbox-label">Enable Half Portion</span>
								</label>
							</div>

							{newItem.halfPortion && (
								<div className="restaurant-section-card">
									<div className="restaurant-section-header">
										<div>
											<div className="section-title">Half Portion Pricing</div>
											<div className="section-subtitle">Great for sampler plates</div>
										</div>
									</div>
									<div className="restaurant-form-row">
										<div className="restaurant-form-group restaurant-half-width">
											<label>Half Portion Price (₹)</label>
											<input type="number" name="halfPrice" className="restaurant-form-control" value={newItem.halfPrice} onChange={handleInputChange} min="0" step="0.01" required={newItem.halfPortion} />
										</div>
										<div className="restaurant-form-group restaurant-half-width">
											<label>Half Offer Type</label>
											<select name="halfDiscountType" className="restaurant-form-control" value={newItem.halfDiscountType} onChange={handleInputChange}>
												{OFFER_OPTIONS.map((option) => (
													<option key={option.value} value={option.value}>{option.label}</option>
												))}
											</select>
										</div>
									</div>
									{newItem.halfDiscountType !== OFFER_TYPES.NONE && (
										<div className="restaurant-form-row">
											<div className="restaurant-form-group restaurant-half-width">
												<label>Half Discount Value</label>
												<input
													type="number"
													name="halfDiscountValue"
													className="restaurant-form-control"
													value={newItem.halfDiscountValue}
													onChange={handleInputChange}
													min="0"
													max={newItem.halfDiscountType === OFFER_TYPES.PERCENTAGE ? 100 : undefined}
													step="0.01"
													required={newItem.halfPortion}
												/>
											</div>
										</div>
									)}
									<div className="restaurant-price-preview">
										<span className="preview-label">Customer Pays</span>
										<span className="preview-value">₹{derivedHalfFinalPrice.toFixed(2)}</span>
									</div>
								</div>
							)}

							<div className="restaurant-form-group">
								<label>Image</label>
								<div className="restaurant-file-upload-wrapper">
									<input type="file" name="image" className="restaurant-file-input" accept="image/*" onChange={handleInputChange} />
									<div className="restaurant-file-upload-box">
										{newItem.image ? (
											<span className="restaurant-file-name-display">Selected: {newItem.image.name}</span>
										) : (
											<>
												<span>Click or Drag to Upload Image</span>
												<small style={{ color: '#9ca3af' }}>PNG, JPG up to 2MB</small>
											</>
										)}
									</div>
								</div>
							</div>
							<div className="restaurant-form-group">
								<label className="restaurant-checkbox-group">
									<input type="checkbox" name="active" className="restaurant-styled-checkbox" checked={newItem.active} onChange={handleInputChange} />
									<span className="restaurant-checkbox-label">Active (Visible to users)</span>
								</label>
							</div>
							<div className="restaurant-form-actions">
								<button type="button" className="restaurant-cancel-btn" onClick={handleModalClose}>Cancel</button>
								<button type="submit" className="restaurant-submit-btn">{editingItemId ? 'Save Changes' : 'Create Item'}</button>
							</div>
						</form>
					</div>
				</div>
			)}
			{showCategoryModal && (
				<div className="category-manager-overlay" onClick={(e) => {
					if (e.target.className === 'category-manager-overlay') {
						handleCategoryModalClose();
					}
				}}>
					<div className="category-manager-card">
						<div className="category-manager-header">
							<h2>Manage Categories</h2>
							<button className="close-btn" onClick={handleCategoryModalClose} title="Close">&times;</button>
						</div>

						<div className="category-manager-body">
							<form className="add-category-row" onSubmit={handleAddCategory}>
								<div className="add-category-input-wrapper">
									<input
										type="text"
										className="add-category-input"
										placeholder="New category name"
										value={newCategory}
										onChange={(e) => setNewCategory(e.target.value)}
										required
									/>
									<label className={`category-image-upload-icon ${categoryImageFile ? 'has-file' : ''}`} title="Upload Custom Image (Optional)">
										<svg width="20" height="20" viewBox="0 0 24 24" fill={categoryImageFile ? '#10b981' : 'none'} stroke={categoryImageFile ? '#10b981' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
											<circle cx="8.5" cy="8.5" r="1.5" />
											<polyline points="21 15 16 10 5 21" />
										</svg>
										<input
											type="file"
											accept="image/*"
											className="hidden-file-input"
											onChange={handleCategoryImageChange}
										/>
									</label>
									{categoryImageFile && (
										<button
											type="button"
											className="clear-image-btn"
											onClick={() => setCategoryImageFile(null)}
											title="Remove Custom Image"
										>
											&times;
										</button>
									)}
								</div>
								<button type="submit" className="add-category-btn">Add</button>
							</form>

							<div className="category-list">
								{categories.map(cat => (
									<div className="category-card" key={cat.id}>
										<img
											src={cat.image_url || fallbackCategoryImage}
											alt={cat.name}
											className="category-image"
											loading="lazy"
											decoding="async"
										/>
										<div className="category-name">{cat.name}</div>
										<div className="category-controls-overlay">
											<label className="cat-toggle" title="Toggle Visibility">
												<input
													type="checkbox"
													checked={cat.is_active !== false}
													onChange={() => handleToggleCategory(cat.id)}
												/>
												<span className="cat-slider round"></span>
											</label>
											<button
												className="cat-delete-btn"
												onClick={() => handleDeleteCategory(cat.id)}
												title="Delete Category"
											>
												<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
													<rect x="5.5" y="8" width="9" height="7" rx="2" stroke="#b85c1c" strokeWidth="1.5" />
													<path d="M8 10v3m4-3v3" stroke="#b85c1c" strokeWidth="1.5" />
													<rect x="8" y="4" width="4" height="2" rx="1" stroke="#b85c1c" strokeWidth="1.5" />
													<path d="M4 6h12" stroke="#b85c1c" strokeWidth="1.5" />
												</svg>
											</button>
										</div>
									</div>
								))}
								{categories.length === 0 && (
									<div style={{ textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
										No categories. Add one above.
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
			{showSubcategoryModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h2 className="modal-title">Manage Subcategories</h2>

						<label style={{ marginBottom: 12, display: 'block' }}>
							Select Category
							<select
								value={selectedCategory}
								onChange={handleCategorySelectChange}
								style={{ marginTop: 6 }}
								required
							>
								<option value="">-- Choose Category --</option>
								{categories.filter(c => c.is_active).map((cat) => (
									<option key={cat.id} value={cat.id}>{cat.name}</option>
								))}
							</select>
						</label>

						{selectedCategory && (
							<>
								<form className="add-category-row" onSubmit={handleAddSubcategory} style={{ marginBottom: 18 }}>
									<div className="add-category-input-wrapper">
										<input
											type="text"
											className="add-category-input"
											placeholder="New subcategory name"
											value={newSubcategory}
											onChange={e => setNewSubcategory(e.target.value)}
											required
										/>
									</div>
									<button type="submit" className="add-category-btn">Add</button>
								</form>
								<hr style={{ margin: '18px 0 10px 0', border: 'none', borderTop: '1.5px solid #f3f4f6' }} />
								<div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 12 }}>Existing Subcategories</div>
								<div className="subcategory-list-modal-row">
									{subcategoriesList.length === 0 ? (
										<div style={{ color: '#6b7280', padding: '12px 0' }}>No subcategories yet. Add one above.</div>
									) : (
										subcategoriesList.map((sub) => (
											<div className="subcategory-row-card" key={sub.id}>
												<div className="subcategory-row-name">{sub.name}</div>
												<div className="subcategory-row-controls">
													<label className="cat-toggle" title="Toggle Visibility">
														<input
															type="checkbox"
															checked={sub.is_active}
															onChange={() => handleToggleSubcategory(sub.id)}
														/>
														<span className="cat-slider round"></span>
													</label>
													<button
														className="cat-delete-btn"
														onClick={() => handleDeleteSubcategory(sub.id)}
														title="Delete Category"
													>
														<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
															<rect x="5.5" y="8" width="9" height="7" rx="2" stroke="#b85c1c" strokeWidth="1.5" />
															<path d="M8 10v3m4-3v3" stroke="#b85c1c" strokeWidth="1.5" />
															<rect x="8" y="4" width="4" height="2" rx="1" stroke="#b85c1c" strokeWidth="1.5" />
															<path d="M4 6h12" stroke="#b85c1c" strokeWidth="1.5" />
														</svg>
													</button>
												</div>
											</div>
										))
									)}
								</div>
							</>
						)}

						<div className="modal-actions" style={{ marginTop: 24 }}>
							<button type="button" className="btn btn-cancel" onClick={handleSubcategoryModalClose}>Close</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Menu;
