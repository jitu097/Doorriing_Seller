import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './offers.css';
import { discountService } from '../../services/discountService';

export default function Offers() {
	const [offers, setOffers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [filter, setFilter] = useState('all');

	// Fetch offers from backend
	useEffect(() => {
		fetchOffers();
	}, []);

	const fetchOffers = async () => {
		try {
			setLoading(true);
			const data = await discountService.getDiscounts();
			setOffers(data);
		} catch (error) {
			console.error('Failed to fetch offers:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleToggleStatus = async (offerId, currentStatus) => {
		try {
			await discountService.toggleDiscount(offerId, !currentStatus);
			fetchOffers();
		} catch (error) {
			console.error('Failed to toggle offer status:', error);
			alert('Failed to update offer status');
		}
	};
	
	const filteredOffers = filter === 'all' 
		? offers 
		: offers.filter(o => filter === 'active' ? o.is_active : !o.is_active);

	if (loading) {
		return (
			<>
				<Navbar />
				<div className="offers-container">
					<div className="loading">Loading offers...</div>
				</div>
			</>
		);
	}

	return (
		<>
			<Navbar />
			<div className="offers-container">
				<div className="offers-header">
					<div>
						<h1>🎁 Discount Offers</h1>
						<p>Create and manage promotional codes</p>
					</div>
					<button className="btn-create-offer" onClick={() => setShowModal(true)}>
						+ Create Offer
					</button>
				</div>

				<div className="offers-filters">
					<button 
						className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
						onClick={() => setFilter('all')}
					>
						All Offers
					</button>
					<button 
						className={filter === 'active' ? 'filter-btn active' : 'filter-btn'}
						onClick={() => setFilter('active')}
					>
						Active
					</button>
					<button 
						className={filter === 'inactive' ? 'filter-btn active' : 'filter-btn'}
						onClick={() => setFilter('inactive')}
					>
						Inactive
					</button>
				</div>

				<div className="offers-grid">
					{filteredOffers.length === 0 ? (
						<div className="no-offers">No offers found</div>
					) : (
						filteredOffers.map((offer) => (
							<div key={offer.id} className="offer-card">
								<div className="offer-header">
									<div>
										<h3>{offer.name}</h3>
										<div className="offer-code">{offer.code}</div>
									</div>
									<span className={offer.is_active ? 'status-badge active' : 'status-badge inactive'}>
										{offer.is_active ? 'Active' : 'Inactive'}
									</span>
								</div>

								<p className="offer-description">{offer.description}</p>

								<div className="offer-details">
									<div className="detail-item">
										<span className="detail-label">Discount</span>
										<span className="detail-value">
											{offer.discount_type === 'percentage' 
												? `${offer.discount_value}%` 
												: `₹${offer.discount_value}`}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Min Order</span>
										<span className="detail-value">₹{offer.min_order_amount || 0}</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Usage</span>
										<span className="detail-value">
											{offer.times_used || 0} {offer.usage_limit ? `/ ${offer.usage_limit}` : ''}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Valid Until</span>
										<span className="detail-value">
											{offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : 'N/A'}
										</span>
									</div>
								</div>

								{offer.usage_limit && (
									<div className="usage-bar">
										<div 
											className="usage-fill" 
											style={{ width: `${((offer.times_used || 0) / offer.usage_limit) * 100}%` }}
										></div>
									</div>
								)}

								<div className="offer-actions">
									<button className="btn-edit">✏️ Edit</button>
									<button 
										className="btn-toggle"
										onClick={() => handleToggleStatus(offer.id, offer.is_active)}
									>
										{offer.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</>
	);
}
