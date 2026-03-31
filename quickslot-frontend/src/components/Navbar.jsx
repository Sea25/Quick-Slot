import { NavLink } from 'react-router-dom';
import { Car, LayoutDashboard, LogIn, LogOut, History, BarChart3 } from 'lucide-react';

export default function Navbar() {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/entry', label: 'Entry', icon: <LogIn size={20} /> },
    { path: '/exit', label: 'Exit', icon: <LogOut size={20} /> },
    { path: '/history', label: 'History', icon: <History size={20} /> },
    { path: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
  ];

  return (
    <nav className="navbar" style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '1rem 0', boxShadow: 'var(--shadow-md)', position: 'sticky', top: 0, zIndex: 10 }}>
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Car size={28} />
          <span>QuickSlot</span>
        </div>
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                transition: 'background-color var(--transition-fast)',
                fontWeight: isActive ? '600' : '400',
              })}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
