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

  useEffect(() => {
    fetchShopStatus();
  }, []);

  const fetchShopStatus = async () => {
    try {
      const shop = await shopService.getShop();
      setIsShopOpen(shop?.is_open ?? true);
    } catch (error) {
      console.error('Failed to fetch shop status:', error);
    }
  };

  const toggleShopStatus = async () => {
    try {
      setLoadingStatus(true);
      const newStatus = !isShopOpen;
      await shopService.toggleStatus(newStatus);
      setIsShopOpen(newStatus);
    } catch (error) {
      console.error('Failed to toggle shop status:', error);
      // Silently fail - backend routes may not be implemented yet
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

  // Utility to detect mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only show these links on mobile
  const mobileNavLabels = ['Dashboard', 'Menu', 'Orders']; // Bookings removed from mobile top nav

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await signOut(auth);
        navigate('/login');
        setSidebarOpen(false);
      } catch (error) {
        console.error('Logout failed:', error);
        alert('Failed to logout');
      }
    }
  };

  const handleProfileClick = () => {
    navigate('/restaurant/profile');
    setSidebarOpen(false);
  };

  return (
    <>
      <nav className="rest-navbar">
        <div className="rest-navbar-left">
          <img src="/logo.png" alt="Logo" className="rest-navbar-logo" />
          <div className="admin-panel-desktop">
            <button
              className={`admin-panel-btn ${isShopOpen ? 'open' : 'closed'}`}
              onClick={toggleShopStatus}
              disabled={loadingStatus}
            >
              <span className={isShopOpen ? 'dot-green' : 'dot-red'} />
              Admin Panel<br />
              <span className="open-label">{isShopOpen ? 'OPEN' : 'CLOSED'}</span>
            </button>
          </div>
        </div>
        <div className="rest-navbar-center">
          {(isMobile
            ? navLinks.filter(link => mobileNavLabels.includes(link.label))
            : navLinks
          ).map(link => (
            <Link
              key={link.label}
              to={link.path}
              className={
                'rest-navbar-link' +
                (location.pathname === link.path ? ' active' : '')
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="rest-navbar-right">
          <NotificationBell />
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
      <div className="rest-navbar-spacer" />
      {/* Mobile Footer */}
      <FooterMobile />

      {/* Sidebar */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <div className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <div className="sidebar-content">
          <Link
            to="/restaurant/bookings"
            className="sidebar-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sidebar-icon">📅</span>
            Bookings
          </Link>
          <button className="sidebar-btn profile-btn" onClick={handleProfileClick}>
            <span className="sidebar-icon">👤</span>
            Profile
          </button>
          <button className="sidebar-btn logout-btn" onClick={handleLogout}>
            <span className="sidebar-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
