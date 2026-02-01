
import React from 'react';
import { Link } from 'react-router-dom';
import './footer.css';

export default function FooterMobile() {
	return (
		<footer className="footer-mobile">
			<Link to="/grocery/offers" className="footer-link">Offers</Link>
			<Link to="/grocery/reports" className="footer-link">Reports</Link>
			<button className="admin-panel-btn open" style={{ minWidth: 0, padding: '8px 18px', fontSize: '1rem' }}>
				<span className="dot-green" />
				Admin Panel<br />
				<span className="open-label">OPEN</span>
			</button>
		</footer>
	);
}
