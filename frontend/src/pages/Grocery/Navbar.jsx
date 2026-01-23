import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navLinks = [
    { label: 'Dashboard', path: '/grocery/dashboard' },
    { label: 'Products', path: '/grocery/products' },
    { label: 'Orders', path: '/grocery/orders' },
    { label: 'Offers', path: '/grocery/offers' },
    { label: 'Reports', path: '/grocery/reports' },
    { label: 'Profile', path: '/grocery/profile' }
  ];

  return (
    <>
      <nav className="grocery-navbar">
        <div className="grocery-navbar-left">
          <img src="/logo.png" alt="Logo" className="grocery-navbar-logo" />
          <button className="admin-panel-btn">
            <span className="dot-green" /> Admin Panel<br /><span className="open-label">OPEN</span>
          </button>
        </div>
        <div className="grocery-navbar-center">
          {navLinks.map(link => (
            <Link
              key={link.label}
              to={link.path}
              className={
                'grocery-navbar-link' +
                (location.pathname === link.path ? ' active' : '')
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="grocery-navbar-right">
          <button className="logout-btn">Logout</button>
        </div>
      </nav>
      <div className="grocery-navbar-spacer" />
    </>
  );
}
