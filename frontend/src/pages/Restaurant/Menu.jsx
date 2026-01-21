
import React, { useState } from 'react';
import './Menu.css';
import Navbar from './Navbar';

const initialCategories = [
	{ name: 'kuo', items: 5, hidden: true, active: false },
	{ name: 'rolls', items: 1, hidden: true, active: true },
	{ name: 'chinese', items: 1, hidden: true, active: true },
	{ name: 'how', items: 1, hidden: false, active: true },
];

const Menu = () => {
	const [categories, setCategories] = useState(initialCategories);
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
		active: true,
	});

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
			name: '', description: '', category: '', image: null, halfPortion: false, price: '', active: true
		});
	};

	const handleModalOpen = () => setShowModal(true);
	const handleCategoryModalOpen = () => setShowCategoryModal(true);
	const handleCategoryModalClose = () => setShowCategoryModal(false);

	const handleCreateItem = (e) => {
		e.preventDefault();
		// Add item to items array
		setItems(prev => [
			...prev,
			{
				name: newItem.name,
				description: newItem.description,
				category: newItem.category,
				image: newItem.image ? URL.createObjectURL(newItem.image) : '',
				halfPortion: newItem.halfPortion,
				priceHalf: newItem.halfPortion ? (newItem.priceHalf || 80) : null,
				priceFull: newItem.price,
				active: newItem.active
			}
		]);
		handleModalClose();
	};

	const handleAddCategory = (e) => {
		e.preventDefault();
		if (newCategory.trim()) {
			setCategories([...categories, { name: newCategory, items: 0, hidden: false, active: true }]);
			setNewCategory('');
		}
	};

	const handleCategoryToggle = (idx) => {
		setCategories(categories => categories.map((cat, i) =>
			i === idx ? { ...cat, active: !cat.active } : cat
		));
	};

	const handleDeleteCategory = (idx) => {
		setCategories(categories => categories.filter((_, i) => i !== idx));
	};

	const handleToggleActive = (idx) => {
		setCategories(categories => categories.map((cat, i) =>
			i === idx ? { ...cat, active: !cat.active } : cat
		));
	};

	return (
		<>
			<Navbar />
			<div className="menu-container">
				<div className="menu-header">
					<span className="menu-emoji" role="img" aria-label="menu">🍽️</span>
					<div>
						<h1 className="menu-title">Manage Menu</h1>
						<div className="menu-overview">Overview: <b>{items.length} Items</b> | <b>{items.filter(i => i.active).length} Active</b> | <b>{categories.length} Categories</b></div>
					</div>
				</div>
				<div className="menu-actions">
					<button className="btn btn-primary" onClick={handleModalOpen}>+ Add New Item</button>
					<button className="btn btn-outline" onClick={handleCategoryModalOpen}>Manage Categories</button>
					<button className="btn btn-ghost">⏰ Special Serving Hours</button>
				</div>

				<div className="menu-categories">
					{categories.map((cat, idx) => {
						const catItems = items.filter(item => item.category === cat.name);
						return (
							<div className="category-accordion" key={cat.name}>
								<div className="category-header">
									<span className="category-arrow" onClick={() => handleAccordion(idx)}>{openIndex === idx ? '▼' : '▶'}</span>
									<span className="category-name" onClick={() => handleAccordion(idx)}>{cat.name}</span>
									<span className="category-items">{catItems.length} items</span>
									{cat.hidden && <span className="category-badge hidden">Hidden</span>}
									<span className="category-toggle">
										<label className="switch">
											<input type="checkbox" checked={cat.active} onChange={() => handleToggleActive(idx)} />
											<span className="slider round"></span>
										</label>
									</span>
								</div>
								{openIndex === idx && (
									<div className="category-content">
										{catItems.length === 0 ? (
											<div className="empty-items">No items to display.</div>
										) : (
											<div className="item-card-list">
												{catItems.map((item, i) => (
													<div className="item-card" key={item.name + i}>
														{item.image && <img src={item.image} alt={item.name} className="item-card-img" />}
														<div className="item-card-body">
															<div className="item-card-header">
																<span className="item-card-title">{item.name}</span>
																{item.active && <span className="item-card-active">ACTIVE</span>}
															</div>
															<div className="item-card-category">{item.category}</div>
															<div className="item-card-desc">{item.description}</div>
															<div className="item-card-prices">
																{item.halfPortion && <span className="item-card-price half">Half: ₹{item.priceHalf}</span>}
																<span className="item-card-price full">Full: ₹{item.priceFull}</span>
															</div>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								)}
							</div>
						);
					})}
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
											<option key={cat.name} value={cat.name}>{cat.name}</option>
										))}
									</select>
								</label>
								<label className="half-portion-label">
									<input type="checkbox" name="halfPortion" checked={newItem.halfPortion} onChange={handleInputChange} /> Enable Half Portion
								</label>
							</div>
							<label>Image
								<div className="image-upload-box">
									<input type="file" name="image" accept="image/*" onChange={handleInputChange} />
									<span>Click to Upload Image</span>
								</div>
							</label>
							<label>Full Price (₹)
								<input type="number" name="price" value={newItem.price} onChange={handleInputChange} required />
							</label>
							<div className="form-row">
								<label className="active-checkbox">
									<input type="checkbox" name="active" checked={newItem.active} onChange={handleInputChange} />
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
							{categories.map((cat, idx) => (
								<div className="category-modal-row" key={cat.name}>
									<span style={{ fontWeight: 700, textTransform: 'lowercase', minWidth: 80 }}>{cat.name}</span>
									<span style={{ color: '#6b7280', fontSize: '0.98rem', marginLeft: 8 }}>({cat.items} items)</span>
									<span className="category-toggle">
										<label className="switch">
											<input type="checkbox" checked={cat.active} onChange={() => handleCategoryToggle(idx)} />
											<span className="slider round"></span>
										</label>
									</span>
									<button className="delete-category-btn" type="button" onClick={() => handleDeleteCategory(idx)} title="Delete">
										<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="5.5" y="9.5" width="1.5" height="6" rx="0.75" fill="#bbb"/><rect x="10.25" y="9.5" width="1.5" height="6" rx="0.75" fill="#bbb"/><rect x="15" y="9.5" width="1.5" height="6" rx="0.75" fill="#bbb"/><rect x="4" y="6" width="14" height="2" rx="1" fill="#eee"/><rect x="7" y="4" width="8" height="2" rx="1" fill="#eee"/></svg>
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
