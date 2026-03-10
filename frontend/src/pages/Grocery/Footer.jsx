
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shopService } from '../../services/shopService';
import './Footer.css';

export default function FooterMobile() {
	const [isShopOpen, setIsShopOpen] = useState(true);
	const [loadingStatus, setLoadingStatus] = useState(false);

	useEffect(() => {
		fetchShopStatus();
	}, []);

	const fetchShopStatus = async () => {
		try {
			const isOpen = await shopService.getShopStatus();
			setIsShopOpen(isOpen);
		} catch (error) {
			// fail silently
		}
	};

	const toggleShopStatus = async () => {
		try {
			setLoadingStatus(true);
			const newStatus = !isShopOpen;
			await shopService.toggleStatus(newStatus);
			setIsShopOpen(newStatus);
		} catch (error) {
			// fail silently
		} finally {
			setLoadingStatus(false);
		}
	};

	return (
		<footer className="footer-mobile">
			{/* <Link to="/grocery/offers" className="footer-link">Offers</Link> */}
			<Link to="/grocery/orders" className="footer-link">Orders</Link>
			<button
				className={`footer-link admin-panel-btn ${isShopOpen ? 'open' : 'closed'}`}
				onClick={toggleShopStatus}
				disabled={loadingStatus}
			>
				<span className={isShopOpen ? 'dot-green' : 'dot-red'} />
				{isShopOpen ? 'Open' : 'Closed'}
			</button>
		</footer>
	);
}
