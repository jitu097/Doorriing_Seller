import React, { useState, useEffect } from 'react';
import './Products.css';
import groceryService from '../../services/groceryService';
import GroceryProductCard from './GroceryProductCard';
import GroceryProductForm from './GroceryProductForm';
import GroceryCategoryManager from './GroceryCategoryManager';
import subcategoryService from '../../services/subcategoryService';

const Products = () => {
	const [categories, setCategories] = useState([]);
	const [subcategories, setSubcategories] = useState([]);
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Accordion State
	const [openIndex, setOpenIndex] = useState(null);

	// Modals
	const [showModal, setShowModal] = useState(false);
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingItem, setEditingItem] = useState(null);

	// Form States
	const [newCategory, setNewCategory] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('');
	const [subcategoriesList, setSubcategoriesList] = useState([]);
	const [newSubcategory, setNewSubcategory] = useState('');
	const [newItem, setNewItem] = useState({
		name: '',
		description: '',
		category_id: '',
		subcategory_id: '',
		image: null,
		stock_quantity: '',
		unit: 'pieces',
		price: '',
		active: true,
	});

	// --- Data Fetching ---
	const fetchData = async () => {
		try {
			setLoading(true);
			const [fetchedCategories, fetchedItems] = await Promise.all([
				groceryService.getGroceryCategories(),
				groceryService.getGroceryItems()
			]);
			setCategories(fetchedCategories || []);
			setItems(fetchedItems || []);
		} catch (err) {
			console.error(err);
			setError('Failed to load products');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// --- Event Handlers ---

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
			if (name === 'category_id' && value) {
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
			} else if (name === 'category_id' && !value) {
				setSubcategories([]);
				setNewItem(prev => ({ ...prev, [name]: value, subcategory_id: '' }));
			} else {
				setNewItem({ ...newItem, [name]: value });
			}
		}
	};

	const handleCategoryInputChange = (e) => {
		setNewCategory(e.target.value);
	};

	const handleModalClose = () => {
		setShowModal(false);
		setEditingItem(null);
		setSubcategories([]);
		setNewItem({
			name: '', description: '', category_id: '', subcategory_id: '', image: null, stock_quantity: '', unit: 'pieces', price: '', active: true
		});
	};

	const handleEditItem = async (item) => {
		setEditingItem(item);
		
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
			category_id: item.category_id || '',
			subcategory_id: item.subcategory_id || '',
			image: null, // Keep null, only update if new file selected
			stock_quantity: item.stock_quantity,
			unit: item.unit || 'pieces',
			price: item.price,
			active: item.is_available
		});
		setShowModal(true);
	};

	const handleToggleItem = async (id, currentStatus) => {
		try {
			const newStatus = !currentStatus;
			// Optimistic update
			setItems(items.map(i => i.id === id ? { ...i, is_available: newStatus } : i));

			await groceryService.toggleItemAvailability(id, newStatus);
		} catch (err) {
			console.error(err);
			alert('Failed to update status');
			fetchData(); // Revert
		}
	};

	const handleSaveItem = async (e) => {
		e.preventDefault();
		try {
			setIsSubmitting(true);

			if (editingItem) {
				// Update Existing
				const updatedItem = await groceryService.updateGroceryItem(editingItem.id, {
					...newItem,
					category_id: newItem.category_id || null
				});

				if (newItem.image) {
					await groceryService.uploadItemImage(editingItem.id, newItem.image);
				}
			} else {
				// Create New
				const createdItem = await groceryService.createGroceryItem({
					...newItem,
					category_id: newItem.category_id || null
				});

				if (newItem.image && createdItem.id) {
					await groceryService.uploadItemImage(createdItem.id, newItem.image);
				}
			}

			// 3. Refresh List
			await fetchData();
			handleModalClose();
		} catch (err) {
			console.error(err);
			alert(err.message || 'Failed to save product');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAddCategory = async (e) => {
		e.preventDefault();
		if (!newCategory.trim()) return;
		try {
			setIsSubmitting(true);
			await groceryService.createGroceryCategory(newCategory);
			setNewCategory('');
			// Refresh categories
			const cats = await groceryService.getGroceryCategories();
			setCategories(cats);
		} catch (err) {
			console.error(err);
			alert(err.message || 'Failed to create category');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteItem = async (id, name) => {
		if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
			try {
				await groceryService.deleteGroceryItem(id);
				// Optimistic UI update
				setItems(items.filter(item => item.id !== id));
			} catch (err) {
				console.error(err);
				alert(err.message || 'Failed to delete item');
				// Revert or refresh on fail
				fetchData();
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
				setIsSubmitting(true);
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
			} finally {
				setIsSubmitting(false);
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

	// --- Derived State for UI ---

	// Group items by category for display
	const getGroupedItems = () => {
		const grouped = categories.map(cat => ({
			...cat,
			items: items.filter(i => i.category_id === cat.id)
		}));

		// Handle "Uncategorized" items
		const uncategorizedItems = items.filter(i => !i.category_id);
		if (uncategorizedItems.length > 0) {
			grouped.push({
				id: 'uncategorized',
				name: 'Uncategorized',
				items: uncategorizedItems,
				active: true, // Virtual category is always active
				hidden: false
			});
		}
		return grouped;
	};

	const groupedData = getGroupedItems();

	if (loading) return <div className="loading-screen">Loading Marketplace...</div>;
	if (error) return <div className="error-screen">Error: {error}</div>;

	return (
		<>
			<div className="menu-container">
				<div className="menu-header">
					<span className="menu-emoji" role="img" aria-label="menu">🛒</span>
					<div>
						<h1 className="menu-title">Grocery Products</h1>
						<div className="menu-overview">
							Overview: <b>{items.length} Items</b> |
							<b>{items.filter(i => i.is_available).length} Active</b> |
							<b>{categories.length} Categories</b>
						</div>
					</div>
				</div>
				<div className="menu-actions">
					<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add New Product</button>
					<button className="btn btn-outline" onClick={() => setShowCategoryModal(true)}>Manage Categories</button>
					<button className="btn btn-outline" onClick={() => setShowSubcategoryModal(true)}>Manage Subcategories</button>
				</div>

				<div className="menu-categories">
					{groupedData.length === 0 ? (
						<div className="empty-state">No products or categories found. Add one to get started!</div>
					) : groupedData.map((cat, idx) => (
						<div className="category-accordion" key={cat.id}>
							<div className="category-header">
								<span className="category-arrow" onClick={() => handleAccordion(idx)}>{openIndex === idx ? '▼' : '▶'}</span>
								<span className="category-name" onClick={() => handleAccordion(idx)}>{cat.name}</span>
								<span className="category-items">{cat.items.length} items</span>
							</div>
							{openIndex === idx && (
								<div className="category-content">
									{cat.items.length === 0 ? (
										<div className="empty-items">No items in this category.</div>
									) : (
										<div className="item-card-list">
											{cat.items.map((item) => (
												<GroceryProductCard
													key={item.id}
													item={item}
													onEdit={handleEditItem}
													onDelete={handleDeleteItem}
													onToggleStatus={handleToggleItem}
												/>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Create Item Modal */}
			{/* Create/Edit Item Modal */}
			<GroceryProductForm
				isOpen={showModal}
				title={editingItem ? 'Edit Product' : 'Add New Item'}
				formData={newItem}
				categories={categories}
				subcategories={subcategories}
				onChange={handleInputChange}
				onSubmit={handleSaveItem}
				onClose={handleModalClose}
				isSubmitting={isSubmitting}
			/>

			{/* Manage Categories Modal */}
			{/* Manage Categories Modal */}
			<GroceryCategoryManager
				isOpen={showCategoryModal}
				categories={categories}
				onClose={() => setShowCategoryModal(false)}
				onCategoriesChange={fetchData}
			/>

			{/* Manage Subcategories Modal */}
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
								{categories.filter(c => c.is_active !== false).map((cat) => (
									<option key={cat.id} value={cat.id}>{cat.name}</option>
								))}
							</select>
						</label>

						{selectedCategory && (
							<>
								<form className="add-category-form" onSubmit={handleAddSubcategory} style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
									<input
										type="text"
										placeholder="New subcategory name"
										value={newSubcategory}
										onChange={e => setNewSubcategory(e.target.value)}
										style={{ flex: 1 }}
										required
									/>
									<button type="submit" className="btn btn-primary" style={{ minWidth: 110 }} disabled={isSubmitting}>Add</button>
								</form>
								<hr style={{ margin: '18px 0 10px 0', border: 'none', borderTop: '1.5px solid #f3f4f6' }} />
								<div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 12 }}>Existing Subcategories</div>
								<div className="category-list-modal">
									{subcategoriesList.length === 0 ? (
										<div style={{ color: '#6b7280', padding: '12px 0' }}>No subcategories yet. Add one above.</div>
									) : (
										subcategoriesList.map((sub) => (
											<div className="category-modal-row" key={sub.id}>
												<span style={{ fontWeight: 700, textTransform: 'lowercase', minWidth: 80 }}>{sub.name}</span>
												<span className="category-toggle">
													<label className="switch">
														<input type="checkbox" checked={sub.is_active} onChange={() => handleToggleSubcategory(sub.id)} style={{ marginLeft: -8 }} />
														<span className="slider round"></span>
													</label>
												</span>
												<button
													className="action-btn delete-btn"
													type="button"
													onClick={() => handleDeleteSubcategory(sub.id)}
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
										))
									)}
								</div>
							</>
						)}

						<div className="modal-actions" style={{ marginTop: 24 }}>
							<button type="button" className="btn btn-cancel" onClick={() => {
								setShowSubcategoryModal(false);
								setSelectedCategory('');
								setSubcategoriesList([]);
								setNewSubcategory('');
							}}>Close</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Products;
