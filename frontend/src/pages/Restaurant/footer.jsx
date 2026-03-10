import React, { useState, useEffect } from 'react';
import './footer.css';
import { Link, useLocation } from 'react-router-dom';
import { shopService } from '../../services/shopService';

export default function FooterMobile() {
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const location = useLocation();

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
      {/* <Link to="/restaurant/offers" className="footer-link">Offers</Link> */}
      <Link
        to="/restaurant/orders"
        className={`footer-link ${location.pathname === '/restaurant/orders' ? 'active' : ''}`}
      >
        Orders
      </Link>
      <Link
        to="/restaurant/bookings"
        className={`footer-link ${location.pathname === '/restaurant/bookings' ? 'active' : ''}`}
      >
        Bookings
      </Link>
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
