import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { shopService } from '../../services/shopService';
import NotificationBell from '../../components/common/NotificationBell';
import FooterMobile from './footer';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 700);
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchShopStatus();
  }, []);

  const fetchShopStatus = async () => {
    try {
      const shop = await shopService.getShop();
      setIsShopOpen(shop?.is_open ?? true);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleShopStatus = async () => {
    try {
      setLoadingStatus(true);
      const newStatus = !isShopOpen;
      await shopService.toggleStatus(newStatus);
      setIsShopOpen(newStatus);
    } finally {
      setLoadingStatus(false);
    }
  };

  const navLinks = [
    { label: 'Dashboard', path: '/restaurant/dashboard' },
    { label: 'Menu', path: '/restaurant/menu' },
    { label: 'Orders', path: '/restaurant/orders' },
    { label: 'Bookings', path: '/restaurant/bookings' },
    { label: 'Offers', path: '/restaurant/offers' },
    { label: 'Reports', path: '/restaurant/reports' }
  ];

  const mobileNavLabels = ['Dashboard', 'Menu', 'Orders'];

  const handleLogout = async () => {
    if (!window.confirm('Logout?')) return;
    await signOut(auth);
    navigate('/login');
    setSidebarOpen(false);
  };

  return (
    <>
      <nav className="rest-navbar">
        <div className="rest-navbar-left">
          <img src="/logo.png" className="rest-navbar-logo" alt="logo" />

          {!isMobile && (
            <button
              className={`admin-panel-btn ${isShopOpen ? 'open' : 'closed'}`}
              onClick={toggleShopStatus}
              disabled={loadingStatus}
            >
              <span className={isShopOpen ? 'dot-green' : 'dot-red'} />
              Admin Panel
              <span className="open-label">{isShopOpen ? 'OPEN' : 'CLOSED'}</span>
            </button>
          )}
        </div>

        <div className="rest-navbar-center">
          {(isMobile
            ? navLinks.filter(l => mobileNavLabels.includes(l.label))
            : navLinks
          ).map(link => (
            <Link
              key={link.label}
              to={link.path}
              className={`rest-navbar-link ${
                location.pathname === link.path ? 'active' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="rest-navbar-right">
          <NotificationBell />
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className="rest-navbar-spacer" />

      <FooterMobile />

      {/* Sidebar */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <div className="sidebar-content">
          <Link to="/restaurant/bookings" onClick={() => setSidebarOpen(false)}>
            📅 Bookings
          </Link>
          <button onClick={() => navigate('/restaurant/profile')}>👤 Profile</button>
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>
    </>
  );
}
