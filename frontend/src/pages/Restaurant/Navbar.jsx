import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { shopService } from '../../services/shopService';
import NotificationBell from '../../components/common/NotificationBell';
import NotificationPermissionPrompt from '../../components/common/NotificationPermissionPrompt';
import Sidebar from '../../components/common/Sidebar';
import { logoutUser } from '../../utils/authManager';
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

    const unsubscribe = shopService.subscribeToShopStatus((isOpen) => {
      setIsShopOpen(isOpen);
    });

    return unsubscribe;
  }, []);

  const fetchShopStatus = async () => {
    try {
      const status = await shopService.getShopStatus();
      setIsShopOpen(status);
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
    { label: 'Reports', path: '/restaurant/reports' },
    { label: 'Wallet', path: '/restaurant/wallet' }
  ];

  const mobileNavLabels = ['Dashboard', 'Menu'];

  const handleLogout = async () => {
    if (!window.confirm('Logout?')) return;
    const loggedOut = await logoutUser();
    if (loggedOut) {
      navigate('/login', { replace: true });
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <nav className="rest-navbar">
        <div className="rest-navbar-left">
          <Link to="/restaurant/dashboard">
            <img src="/Doorriing.png" className="rest-navbar-logo" alt="logo" />
          </Link>

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
              className={`rest-navbar-link ${location.pathname === link.path ? 'active' : ''
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="rest-navbar-right">
          <NotificationPermissionPrompt />
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
        profilePath="/restaurant/profile"
        menuItems={[
          {
            path: '/restaurant/dashboard', label: 'Home', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            )
          },
          {
            path: '/restaurant/menu', label: 'Menu', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18" />
              </svg>
            )
          },
          {
            path: '/restaurant/orders', label: 'Orders', icon: (
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
            path: '/restaurant/bookings', label: 'Bookings', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            )
          },
          {
            path: '/restaurant/reports', label: 'Reports', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            )
          },
          {
            path: '/restaurant/wallet', label: 'Wallet', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
              </svg>
            )
          },
          {
            path: '/contact', label: 'Contact Us', icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            )
          }
        ]}
      />
    </>
  );
}
