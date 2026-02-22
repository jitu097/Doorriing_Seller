import React, { useState, useEffect } from 'react';
import './Menu.css';
import MenuItemCard from './MenuItemCard';
import categoryService from '../../services/restaurantCategoryService';
import itemService from '../../services/itemService';
import subcategoryService from '../../services/restaurantSubcategoryService';

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
	const [subcategoryImageFile, setSubcategoryImageFile] = useState(null);
	const [newItem, setNewItem] = useState({
		name: '',
		description: '',
		category: '',
		subcategory_id: '',
		image: null,
		halfPortion: false,
		price: '',
		priceHalf: '',
		unit: 'plate',
		active: true,
	});
	const fallbackCategoryImage = '/images/category-placeholder.png';

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
			setNewItem({ ...newItem, [name]: checked });
		} else if (type === 'file') {
			setNewItem({ ...newItem, image: files[0] });
		} else {
			// Load subcategories when category changes
			if (name === 'category' && value) {
				try {
					console.log('Loading subcategories for category:', value);
					const subs = await subcategoryService.getSubcategories(value);
					console.log('Loaded subcategories:', subs);
					setSubcategories(subs || []);
					setNewItem(prev => ({ ...prev, [name]: value, subcategory_id: '' })); // Update category and reset subcategory
				} catch (error) {
					console.error('Failed to load subcategories:', error);
					setSubcategories([]);
					setNewItem({ ...newItem, [name]: value });
				}
			} else if (name === 'category' && !value) {
				setSubcategories([]);
				setNewItem(prev => ({ ...prev, [name]: value, subcategory_id: '' }));
			} else {
				setNewItem({ ...newItem, [name]: value });
			}
		}
	};

	const handleModalClose = () => {
		setShowModal(false);
		setSubcategories([]);
		setNewItem({
			name: '', description: '', category: '', subcategory_id: '', image: null, halfPortion: false, price: '', priceHalf: '', unit: 'plate', active: true
		});
	};

	const handleModalOpen = () => setShowModal(true);
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
		setSubcategoryImageFile(null);
	};

	const handleCategoryImageChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			setCategoryImageFile(e.target.files[0]);
		}
	};

	const handleSubcategoryImageChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			setSubcategoryImageFile(e.target.files[0]);
		}
	};

	const handleCreateItem = async (e) => {
		e.preventDefault();
		try {
			const itemData = {
				name: newItem.name,
				description: newItem.description,
				category_id: newItem.category,
				subcategory_id: newItem.subcategory_id || null,
				price: parseFloat(newItem.price),
				half_portion_price: newItem.halfPortion ? parseFloat(newItem.priceHalf || 0) : null,
				unit: newItem.unit,
				is_available: newItem.active
			};

			const created = await itemService.createItem(itemData);

			// Upload image if provided
			if (newItem.image && created.id) {
				await itemService.uploadItemImage(created.id, newItem.image);
			}

			// Refresh categories to get updated items
			fetchCategories();
			handleModalClose();
		} catch (error) {
			console.error('Failed to create item:', error);
			alert('Failed to create item. Please try again.');
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
				}, subcategoryImageFile);
				const subs = await subcategoryService.getSubcategories(selectedCategory);
				setSubcategoriesList(subs || []);
				setNewSubcategory('');
				setSubcategoryImageFile(null);
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
				<div className="menu-actions-row">
					<button className="btn btn-primary" onClick={handleModalOpen}>+ Add New Item</button>
					<button className="btn btn-outline" onClick={handleCategoryModalOpen}>
						Categories</button>
					<button className="btn btn-outline" onClick={handleSubcategoryModalOpen}>
						Subcategories</button>
					<button className="btn btn-ghost">⏰Prime Hours</button>
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
										style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', marginRight: 10 }}
									/>
									<span className="category-name" onClick={() => handleAccordion(idx)}>{cat.name}</span>
									<span className="category-items">{cat.items?.length || 0} items</span>
									{!cat.is_active && <span className="category-badge hidden">Hidden</span>}
									<span className="category-toggle">
										<label className="switch">
											<input type="checkbox" checked={cat.is_active} onChange={() => handleToggleCategory(cat.id)} style={{ marginLeft: -8 }} />
											<span className="slider round"></span>
										</label>
									</span>
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
														
														setNewItem({
															name: item.name,
															description: item.description || '',
															category: item.category_id || cat.id,
															subcategory_id: item.subcategory_id || '',
																image: null,
																halfPortion: !!item.half_portion_price,
																price: item.price,
																priceHalf: item.half_portion_price || '',
																unit: item.unit || 'plate',
																active: item.is_available
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
				<div className="modal-overlay">
					<div className="modal-content">
						<h2 className="modal-title">Add New Item</h2>
						<form className="add-item-form" onSubmit={handleCreateItem}>
							<label>Item Name
								<input type="text" name="name" placeholder="e.g. Butter Chicken" value={newItem.name} onChange={handleInputChange} required />
							</label>
							<label>Description
								<textarea name="description" placeholder="Short description of the item" value={newItem.description} onChange={handleInputChange} />
							</label>
							<div className="form-row">
								<label>Category
									<select name="category" value={newItem.category} onChange={handleInputChange} required>
										<option value="">Select Category</option>
										{categories.map((cat) => (
											<option key={cat.id} value={cat.id}>{cat.name}</option>
										))}
									</select>
								</label>
								<label className="half-portion-label">
									<input type="checkbox" name="halfPortion" checked={newItem.halfPortion} onChange={handleInputChange} style={{ marginLeft: -8 }} /> Enable Half Portion
								</label>
						</div>
						<label>Subcategory (optional)
							<select name="subcategory_id" value={newItem.subcategory_id} onChange={handleInputChange}>
								<option value="">None</option>
							{subcategories.filter(sub => sub.is_active).map((sub) => (
									<option key={sub.id} value={sub.id}>{sub.name}</option>
								))}
							</select>
						</label>
						{newItem.halfPortion && (
								<label>Half Portion Price (₹)
									<input type="number" name="priceHalf" value={newItem.priceHalf} onChange={handleInputChange} required={newItem.halfPortion} />
								</label>
							)}
							<label>Image
								<div className="image-upload-box">
									<input type="file" name="image" accept="image/*" onChange={handleInputChange} />
									<span>Click to Upload Image</span>
								</div>
							</label>
							<label>Full Price (₹)
								<input type="number" name="price" value={newItem.price} onChange={handleInputChange} required />
							</label>
							<label>Unit
								<select name="unit" value={newItem.unit} onChange={handleInputChange} required>
									<option value="plate">Plate</option>
									<option value="piece">Piece</option>
									<option value="kg">Kg</option>
									<option value="gm">Gm</option>
									<option value="ltr">Ltr</option>
									<option value="ml">Ml</option>
								</select>
							</label>
							<div className="form-row">
								<label className="active-checkbox">
									<input type="checkbox" name="active" checked={newItem.active} onChange={handleInputChange} style={{ marginLeft: 10 }} />
									<span>Active (Visible to users)</span>
								</label>
							</div>
							<div className="modal-actions">
								<button type="button" className="btn btn-cancel" onClick={handleModalClose}>Cancel</button>
								<button type="submit" className="btn btn-primary">Create Item</button>
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
										<label className={`category-image-upload-icon ${subcategoryImageFile ? 'has-file' : ''}`} title="Upload Custom Image (Optional)">
											<svg width="20" height="20" viewBox="0 0 24 24" fill={subcategoryImageFile ? '#10b981' : 'none'} stroke={subcategoryImageFile ? '#10b981' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
												<circle cx="8.5" cy="8.5" r="1.5" />
												<polyline points="21 15 16 10 5 21" />
											</svg>
											<input
												type="file"
												accept="image/*"
												className="hidden-file-input"
												onChange={handleSubcategoryImageChange}
											/>
										</label>
										{subcategoryImageFile && (
											<button
												type="button"
												className="clear-image-btn"
												onClick={() => setSubcategoryImageFile(null)}
												title="Remove Custom Image"
											>
												&times;
											</button>
										)}
									</div>
									<button type="submit" className="add-category-btn">Add</button>
								</form>
								<hr style={{ margin: '18px 0 10px 0', border: 'none', borderTop: '1.5px solid #f3f4f6' }} />
								<div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 12 }}>Existing Subcategories</div>
								<div className="category-list-modal">
									{subcategoriesList.length === 0 ? (
										<div style={{ color: '#6b7280', padding: '12px 0' }}>No subcategories yet. Add one above.</div>
									) : (
										subcategoriesList.map((sub) => (
											<div className="subcategory-card" key={sub.id}>
												<img
													src={sub.image_url || fallbackCategoryImage}
													alt={sub.name}
													loading="lazy"
													className="subcategory-image"
													decoding="async"
												/>
												<div className="subcategory-name">{sub.name}</div>
												<div className="cat-controls-overlay">
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
