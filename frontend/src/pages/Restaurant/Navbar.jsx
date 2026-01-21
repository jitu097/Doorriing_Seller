import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';


export default function Navbar() {
  const location = useLocation();
  const navLinks = [
    { label: 'Dashboard', path: '/restaurant/dashboard' },
    { label: 'Menu', path: '/restaurant/menu' },
    { label: 'Orders', path: '/admin/orders' },
    { label: 'Bookings', path: '/admin/bookings' },
    { label: 'Offers', path: '/admin/offers' },
    { label: 'Reports', path: '/admin/reports' },
    { label: 'Profile', path: '/admin/profile' }
  ];

  return (
    <>
      <nav className="rest-navbar">
        <div className="rest-navbar-left">
          <img src="/logo.png" alt="Logo" className="rest-navbar-logo" />
          <button className="admin-panel-btn">
            <span className="dot-green" /> Admin Panel<br /><span className="open-label">OPEN</span>
          </button>
        </div>
        <div className="rest-navbar-center">
          {navLinks.map(link => (
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
          <button className="logout-btn">Logout</button>
        </div>
      </nav>
      <div className="rest-navbar-spacer" />
    </>
  );
}
