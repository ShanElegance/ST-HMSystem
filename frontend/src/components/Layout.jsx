import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, MapPinned, Bus, GraduationCap, UserCog, BedDouble, Wallet, UtensilsCrossed, LogOut, Menu, Mountain, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = {
  ADMIN: [['/', 'Dashboard', LayoutDashboard], ['/map', 'Live Map', MapPinned], ['/transport', 'Transport', Bus], ['/students', 'Students', GraduationCap], ['/staff', 'Staff', UserCog], ['/hostel', 'Hostel Rooms', BedDouble], ['/fees', 'Fees', Wallet], ['/menu', 'Mess Menu', UtensilsCrossed]],
  WARDEN: [['/', 'Dashboard', LayoutDashboard], ['/map', 'Live Map', MapPinned], ['/students', 'Students', GraduationCap], ['/hostel', 'Hostel Rooms', BedDouble], ['/fees', 'Fees', Wallet], ['/menu', 'Mess Menu', UtensilsCrossed]],
  DRIVER: [['/', 'My Bus', Bus]],
  STUDENT: [['/', 'My Dashboard', LayoutDashboard], ['/map', 'Track My Bus', MapPinned], ['/fees', 'My Fees', Wallet], ['/menu', 'Mess Menu', UtensilsCrossed]],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="shell">
      {/* Mobile backdrop */}
      <div className={`sidebar-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <Mountain size={26} />
          <div><b>Shan Elegance</b><small>Skardu · Gilgit-Baltistan</small></div>
          <button className="icon-btn mobile-close-btn" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav>
          {(NAV[user?.role] || []).map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={19} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">Transport & Hostel<br />Management System</div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu"><Menu size={22} /></button>
          <div className="topbar-brand">
            <Mountain size={20} />
            <span>Shan Elegance</span>
          </div>
          <div className="spacer" />
          <div className="who"><div className="avatar">{user?.name?.[0] || '?'}</div><div><b>{user?.name}</b><small>{user?.role}</small></div></div>
          <button className="btn ghost logout-btn" onClick={logout}><LogOut size={16} /><span>Logout</span></button>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
