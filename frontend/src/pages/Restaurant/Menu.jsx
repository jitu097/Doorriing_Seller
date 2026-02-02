import React, { useState, useEffect } from 'react';
import './Menu.css';
import MenuItemCard from './MenuItemCard';
import categoryService from '../../services/categoryService';
import itemService from '../../services/itemService';

const Menu = () => {
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openIndex, setOpenIndex] = useState(null);
	const [items, setItems] = useState([]);

	const [showModal, setShowModal] = useState(false);
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [newCategory, setNewCategory] = useState('');
	const [newItem, setNewItem] = useState({
		name: '',
		description: '',
		category: '',
		image: null,
		halfPortion: false,
		price: '',
		priceHalf: '',
		unit: 'plate',
		active: true,
	});

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

	const handleInputChange = (e) => {
		const { name, value, type, checked, files } = e.target;
		if (type === 'checkbox') {
			setNewItem({ ...newItem, [name]: checked });
		} else if (type === 'file') {
			setNewItem({ ...newItem, image: files[0] });
		} else {
			setNewItem({ ...newItem, [name]: value });
		}
	};

	const handleModalClose = () => {
		setShowModal(false);
		setNewItem({
			name: '', description: '', category: '', image: null, halfPortion: false, price: '', priceHalf: '', unit: 'plate', active: true
		});
	};

	const handleModalOpen = () => setShowModal(true);
	const handleCategoryModalOpen = () => setShowCategoryModal(true);
	const handleCategoryModalClose = () => setShowCategoryModal(false);

	const handleCreateItem = async (e) => {
		e.preventDefault();
		try {
			const itemData = {
				name: newItem.name,
				description: newItem.description,
				category_id: newItem.category,
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
				});
				fetchCategories();
				setNewCategory('');
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
														onEdit={(item) => {
															setNewItem({
																name: item.name,
																description: item.description || '',
																category: item.category_id || cat.id,
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
				<div className="modal-overlay">
					<div className="modal-content">
						<h2 className="modal-title">Manage Categories</h2>
						<form className="add-category-form" onSubmit={handleAddCategory} style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
							<input
								type="text"
								placeholder="New category name"
								value={newCategory}
								onChange={e => setNewCategory(e.target.value)}
								style={{ flex: 1 }}
								required
							/>
							<button type="submit" className="btn btn-primary" style={{ minWidth: 110 }}>Add</button>
						</form>
						<hr style={{ margin: '18px 0 10px 0', border: 'none', borderTop: '1.5px solid #f3f4f6' }} />
						<div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 12 }}>Existing Categories</div>
						<div className="category-list-modal">
							{categories.map((cat) => (
								<div className="category-modal-row" key={cat.id}>
									<span style={{ fontWeight: 700, textTransform: 'lowercase', minWidth: 80 }}>{cat.name}</span>
									<span style={{ color: '#6b7280', fontSize: '0.98rem', marginLeft: 8 }}>({cat.items?.length || 0} items)</span>
									<span className="category-toggle">
										<label className="switch">
											<input type="checkbox" checked={cat.is_active} onChange={() => handleToggleCategory(cat.id)} style={{ marginLeft: -8 }} />
											<span className="slider round"></span>
										</label>
									</span>
									<button
										className="action-btn delete-btn"
										type="button"
										onClick={() => handleDeleteCategory(cat.id)}
										title="Delete"
										style={{ marginLeft: '10px' }}
									>
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<polyline points="3 6 5 6 21 6"></polyline>
											<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
											<line x1="10" y1="11" x2="10" y2="17"></line>
											<line x1="14" y1="11" x2="14" y2="17"></line>
										</svg>
									</button>
								</div>
							))}
						</div>
						<div className="modal-actions" style={{ marginTop: 24 }}>
							<button type="button" className="btn btn-cancel" onClick={handleCategoryModalClose}>Close</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Menu;
