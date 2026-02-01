
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import FooterMobile from './Footer';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 700);
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { label: 'Dashboard', path: '/grocery/dashboard' },
    { label: 'Products', path: '/grocery/products' },
    { label: 'Orders', path: '/grocery/orders' },
    { label: 'Offers', path: '/grocery/offers' },
    { label: 'Reports', path: '/grocery/reports' }
  ];
  const mobileNavLabels = ['Dashboard', 'Products', 'Orders'];

  return (
    <>
      <nav className="rest-navbar">
        <div className="rest-navbar-left">
          <img src="/logo.png" className="rest-navbar-logo" alt="logo" />
          {!isMobile && (
            <button className="admin-panel-btn open">
              <span className="dot-green" />
              Admin Panel
              <span className="open-label">OPEN</span>
            </button>
          )}
        </div>
        <div className="rest-navbar-center">
          {(isMobile ? navLinks.filter(l => mobileNavLabels.includes(l.label)) : navLinks).map(link => (
            <Link
              key={link.label}
              to={link.path}
              className={`rest-navbar-link ${location.pathname === link.path ? 'active' : ''}`}
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
          <Link to="/grocery/profile" onClick={() => setSidebarOpen(false)}>
            👤 Profile
          </Link>
          <button className="logout-btn">🚪 Logout</button>
        </div>
      </div>
    </>
  );
}
