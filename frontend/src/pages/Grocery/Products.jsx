import React, { useState, useEffect } from 'react';
import './Products.css';
import groceryService from '../../services/groceryService';
import GroceryProductCard from './GroceryProductCard';
import GroceryProductForm from './GroceryProductForm';
import GroceryCategoryManager from './GroceryCategoryManager';

const Products = () => {
	const [categories, setCategories] = useState([]);
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Accordion State
	const [openIndex, setOpenIndex] = useState(null);

	// Modals
	const [showModal, setShowModal] = useState(false);
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingItem, setEditingItem] = useState(null);

	// Form States
	const [newCategory, setNewCategory] = useState('');
	const [newItem, setNewItem] = useState({
		name: '',
		description: '',
		category_id: '',
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

	const handleCategoryInputChange = (e) => {
		setNewCategory(e.target.value);
	};

	const handleModalClose = () => {
		setShowModal(false);
		setEditingItem(null);
		setNewItem({
			name: '', description: '', category_id: '', image: null, stock_quantity: '', unit: 'pieces', price: '', active: true
		});
	};

	const handleEditItem = (item) => {
		setEditingItem(item);
		setNewItem({
			name: item.name,
			description: item.description || '',
			category_id: item.category_id || '',
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
		</>
	);
};

export default Products;
