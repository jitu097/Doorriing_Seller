import React, { useState, useEffect } from 'react';
import './Products.css';
import Navbar from './Navbar';
import groceryService from '../../services/groceryService';

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
		setNewItem({
			name: '', description: '', category_id: '', image: null, stock_quantity: '', unit: 'pieces', price: '', active: true
		});
	};

	const handleCreateItem = async (e) => {
		e.preventDefault();
		try {
			setIsSubmitting(true);
			// 1. Create Item
			const createdItem = await groceryService.createGroceryItem({
				...newItem,
				category_id: newItem.category_id || null // Ensure empty string becomes null
			});

			// 2. Upload Image if exists
			if (newItem.image && createdItem.id) {
				await groceryService.uploadItemImage(createdItem.id, newItem.image);
			}

			// 3. Refresh List
			await fetchData();
			handleModalClose();
		} catch (err) {
			console.error(err);
			alert(err.message || 'Failed to create product');
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
			<Navbar />
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
												<>
												{/* Desktop view: keep existing card */}
												<div className="item-card modern item-card-desktop" key={item.id}>
													{/* Active badge */}
													{item.is_available && (
														<span className="item-badge-active">ACTIVE</span>
													)}
													{/* Product image or icon */}
													<div className="item-card-imgbox">
														{item.image_url ? (
															<img src={item.image_url} alt={item.name} className="item-card-img" />
														) : (
															<span className="item-card-img-placeholder">🛒</span>
														)}
													</div>
													{/* Main info */}
													<div className="item-card-main">
														<div className="item-card-row item-card-row-top">
															<span className="item-card-title">{item.name}</span>
															<button className="item-card-btn item-card-btn-edit" title="Edit">
																<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.7 2.29a1 1 0 0 1 1.42 0l1.59 1.59a1 1 0 0 1 0 1.42l-9.17 9.17-2.12.53.53-2.12 9.17-9.17z" stroke="#b85c1c" strokeWidth="1.5" fill="none"/><path d="M12.88 4.12l2.12 2.12" stroke="#b85c1c" strokeWidth="1.5"/></svg>
															</button>
															<button className="item-card-btn item-card-btn-delete" title="Delete">
																<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="5.5" y="8" width="9" height="7" rx="2" stroke="#b85c1c" strokeWidth="1.5"/><path d="M8 10v3m4-3v3" stroke="#b85c1c" strokeWidth="1.5"/><rect x="8" y="4" width="4" height="2" rx="1" stroke="#b85c1c" strokeWidth="1.5"/><path d="M4 6h12" stroke="#b85c1c" strokeWidth="1.5"/></svg>
															</button>
														</div>
														<div className="item-card-row item-card-row-prices">
															<span className="item-card-price-half">Half: <b>₹{item.price_half ?? '--'}</b></span>
															<span className="item-card-price-full">Full: <b>₹{item.price_full ?? item.price ?? '--'}</b></span>
														</div>
														<div className="item-card-row item-card-row-bottom">
															<label className="item-card-bestseller">
																<input type="checkbox" checked={item.is_best_seller || false} readOnly />
																<span>Best Seller</span>
															</label>
															<span className="item-card-qty">Qty: {item.stock_quantity} {item.unit}</span>
														</div>
													</div>
												</div>
												{/* Mobile view: new card UI, hidden on desktop */}
												<div className="item-card-mobile" key={item.id + '-mobile'}>
													<div style={{ display: 'flex', alignItems: 'center', gap: 18, background: '#f4f0e6', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 18, marginBottom: 18, minWidth: 0, width: '100%' }}>
														{/* Avatar and status */}
														<div style={{ position: 'relative', minWidth: 80, minHeight:90 }}>
															<img
																src={item.image_url || '/avatar-default.png'}
																alt={item.name}
																style={{ width: 100, height: 90, borderRadius: 16, objectFit: 'cover', position: 'relative', left: -20 }}
															/>
															{item.is_available && (
																<span style={{ position: 'absolute', top: -35, left: -9, background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, borderRadius: 8, padding: '2px 10px', boxShadow: '0 1px 4px #0002' }}>
																	ACTIVE
																</span>
															)}
														</div>
														{/* Main content */}
														<div style={{ flex: 1, minWidth: 0 }}>
															<div style={{ fontWeight: 700, fontSize: 20, marginBottom: 30 }}>{item.name}</div>
															<div style={{ color: '#0b0d12', fontSize: 15, marginBottom: 6 }}>{item.description}</div>
															<div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
																{item.half_portion_price && (
																	<span style={{ background: '#e0edff', color: '#2563eb', border: 'none', borderRadius: 0, padding: '4px 16px', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center' }}>
																		Half: ₹{item.half_portion_price}
																	</span>
																)}
																<span style={{ background: '#ffedd5', color: '#ea580c', border: 'none', borderRadius: 8, padding: '4px 16px', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center' }}>
																	Full: ₹{item.price}
																</span>
															</div>
															<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
																<label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
																	<input type="checkbox" checked={item.is_best_seller || false} readOnly style={{ width: 22, height: 22, marginRight: -3, marginLeft: -8 }} />
																	<span style={{ background: '#fbbf24', color: '#fff', borderRadius: 6, padding: '2px 7px', fontWeight: 700, fontSize: 15, marginRight: 2 }}>Best Seller</span>
																</label>
															</div>
														</div>
														{/* Actions */}
														<div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
															<button style={{ background: '#e0f2fe', border: 'none', borderRadius: 8, padding: 6, marginBottom: 2, cursor: 'pointer' }} title={item.is_active ? 'Deactivate' : 'Activate'}>
																<svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="2" rx="1" fill="#2563eb"/></svg>
															</button>
															<button style={{ background: '#e0e7ff', border: 'none', borderRadius: 8, padding: 6, marginBottom: 2, cursor: 'pointer' }} title="Edit">
																<img src="/edit.png" alt="Edit" style={{ width: 22, height: 22 }} />
															</button>
															<button style={{ background: '#fee2e2', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }} title="Delete">
																<img src="/delete.png" alt="Delete" style={{ width: 22, height: 22 }} />
															</button>
														</div>
													</div>
												</div>
												</>
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
			{showModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h2 className="modal-title">Add New Product</h2>
						<form className="add-item-form" onSubmit={handleCreateItem}>
							<label>Product Name
								<input type="text" name="name" value={newItem.name} onChange={handleInputChange} required />
							</label>

							<label>Description (Optional)
								<textarea name="description" value={newItem.description} onChange={handleInputChange} />
							</label>

							<div className="form-row">
								<label>Category (Optional)
									<select name="category_id" value={newItem.category_id} onChange={handleInputChange}>
										<option value="">No Category</option>
										{categories.map((cat) => (
											<option key={cat.id} value={cat.id}>{cat.name}</option>
										))}
									</select>
								</label>

								<label>Quantity & Unit
									<div style={{ display: 'flex', gap: 8 }}>
										<input type="number" name="stock_quantity" placeholder="Qty" value={newItem.stock_quantity} onChange={handleInputChange} required style={{ width: '80px' }} />
										<select name="unit" value={newItem.unit} onChange={handleInputChange} required style={{ width: '110px' }}>
											<option value="pieces">Pieces</option>
											<option value="kg">Kg</option>
											<option value="gram">Gram</option>
											<option value="litre">Litre</option>
											<option value="ml">ml</option>
											<option value="packet">Packet</option>
											<option value="box">Box</option>
											<option value="dozen">Dozen</option>
										</select>
									</div>
								</label>
							</div>

							<label>Price (₹)
								<input type="number" name="price" value={newItem.price} onChange={handleInputChange} required />
							</label>

							<label>Image
								<div className="image-upload-box">
									<input type="file" name="image" accept="image/*" onChange={handleInputChange} />
									<span>{newItem.image ? newItem.image.name : 'Click to Upload Image'}</span>
								</div>
							</label>

							<label className="active-checkbox">
								<input type="checkbox" name="active" checked={newItem.active} onChange={handleInputChange} />
								<span>Active (Visible to users)</span>
							</label>

							<div className="modal-actions">
								<button type="button" className="btn btn-cancel" onClick={handleModalClose}>Cancel</button>
								<button type="submit" className="btn btn-primary" disabled={isSubmitting}>
									{isSubmitting ? 'Creating...' : 'Create Product'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Manage Categories Modal */}
			{showCategoryModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h2 className="modal-title">Manage Categories</h2>
						<form className="add-category-form" onSubmit={handleAddCategory} style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
							<input
								type="text"
								placeholder="New category name"
								value={newCategory}
								onChange={handleCategoryInputChange}
								style={{ flex: 1 }}
								required
							/>
							<button type="submit" className="btn btn-primary" style={{ minWidth: 110 }} disabled={isSubmitting}>
								{isSubmitting ? 'Adding...' : 'Add'}
							</button>
						</form>

						<div className="category-list-modal">
							{categories.map((cat) => (
								<div className="category-modal-row" key={cat.id}>
									<span style={{ fontWeight: 700 }}>{cat.name}</span>
								</div>
							))}
						</div>

						<div className="modal-actions" style={{ marginTop: 24 }}>
							<button type="button" className="btn btn-cancel" onClick={() => setShowCategoryModal(false)}>Close</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Products;
