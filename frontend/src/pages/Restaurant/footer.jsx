import React, { useState, useEffect } from 'react';
import './footer.css';
import { Link } from 'react-router-dom';
import { shopService } from '../../services/shopService';

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
      <Link to="/restaurant/offers" className="footer-link">Offers</Link>
      <Link to="/restaurant/reports" className="footer-link">Reports</Link>
      <button
        className={`admin-panel-btn ${isShopOpen ? 'open' : 'closed'}`}
        onClick={toggleShopStatus}
        disabled={loadingStatus}
        style={{ minWidth: 0, padding: '8px 18px', fontSize: '1rem' }}
      >
        <span className={isShopOpen ? 'dot-green' : 'dot-red'} />
        Admin Panel<br />
        <span className="open-label">{isShopOpen ? 'OPEN' : 'CLOSED'}</span>
      </button>
    </footer>
  );
}
