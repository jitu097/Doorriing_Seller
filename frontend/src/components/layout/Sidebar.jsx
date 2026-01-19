import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const menuItems = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Orders', path: '/orders' },
        { name: 'Items', path: '/items' },
        { name: 'Discounts', path: '/discounts' },
        { name: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="sidebar">
            <ul className="menu-list">
                {menuItems.map((item) => (
                    <li key={item.name} className="menu-item">
                        <NavLink
                            to={item.path}
                            className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                        >
                            {item.name}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar;
