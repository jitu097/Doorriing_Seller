import React, { useState } from 'react';
import '../../styles/layout/sidebar.css';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);

    const menuItems = [
        { name: 'Dashboard', icon: '📊', path: '/dashboard' },
        { name: 'Orders', icon: '📦', path: '/orders' },
        { name: 'Menu Items', icon: '🍔', path: '/menu' },
        { name: 'Analytics', icon: '📈', path: '/analytics' },
        { name: 'Settings', icon: '⚙️', path: '/settings' },
    ];

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-menu">
                {menuItems.map((item) => (
                    <div key={item.name} className={`sidebar-item ${item.name === 'Dashboard' ? 'active' : ''}`}>
                        <span className="sidebar-icon">{item.icon}</span>
                        {!collapsed && <span>{item.name}</span>}
                    </div>
                ))}
            </div>

            <button
                className="toggle-btn"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? "Expand" : "Collapse"}
            >
                {collapsed ? '→' : '←'}
            </button>
        </aside>
    );
};

export default Sidebar;
