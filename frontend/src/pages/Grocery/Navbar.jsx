
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import Sidebar from '../../components/common/Sidebar';
import FooterMobile from './Footer';
import { shopService } from '../../services/shopService';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);

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
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        profilePath="/grocery/profile"
        menuItems={[
          {
            path: '/grocery/dashboard', label: 'Home', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            )
          },
          {
            path: '/grocery/products', label: 'Products', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            )
          },
          {
            path: '/grocery/orders', label: 'Orders', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            )
          },
          {
            path: '/grocery/offers', label: 'Offers', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            )
          },
          {
            path: '/grocery/reports', label: 'Reports', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            )
          }
        ]}
      />
    </>
  );
}
