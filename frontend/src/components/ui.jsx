import { X } from 'lucide-react';

export const PageHeader = ({ title, sub, children }) => (
  <div className="page-head">
    <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
    <div className="actions">{children}</div>
  </div>
);

export const Modal = ({ title, onClose, children, wide }) => (
  <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`modal ${wide ? 'wide' : ''}`}>
      <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

export const Badge = ({ tone = 'gray', children }) => <span className={`badge ${tone}`}>{children}</span>;

export const Stat = ({ icon: Icon, label, value, hint, tone = 'teal' }) => (
  <div className="card stat">
    <div className={`stat-icon ${tone}`}><Icon size={22} /></div>
    <div><div className="stat-label">{label}</div><div className="stat-value">{value}</div>{hint && <div className="stat-hint">{hint}</div>}</div>
  </div>
);

export const Progress = ({ value, max, tone = 'teal' }) => (
  <div className="progress"><div className={`bar ${tone}`} style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} /></div>
);

export const Empty = ({ children }) => <div className="empty">{children}</div>;
export const Spinner = () => <div className="splash">Loading…</div>;
