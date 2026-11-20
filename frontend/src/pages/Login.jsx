import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mountain, Bus, BedDouble, MapPinned } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

const DEMO = [['Admin', 'admin@shanelegance.pk', 'ChangeMe@123'], ['Warden', 'warden@shanelegance.pk', 'Skardu@123'], ['Driver', 'driver1@shanelegance.pk', 'Skardu@123'], ['Student', 'se-012@student.shanelegance.pk', 'Skardu@123']];

export default function Login() {
  const { user, login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await login(f.email, f.password); } catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  return (
    <div className="login">
      <div className="login-hero">
        <Mountain size={44} />
        <h1>Shan Elegance<br />Transport & Hostel</h1>
        <p>One portal for school buses, live tracking, hostel rooms, mess and fees — built for Skardu.</p>
        <ul>
          <li><MapPinned size={18} /> Live bus tracking across Skardu</li>
          <li><Bus size={18} /> 3 buses · 3 drivers · smart routes</li>
          <li><BedDouble size={18} /> 30 hostel rooms with Balti-style mess</li>
        </ul>
      </div>
      <form className="login-card" onSubmit={submit}>
        <h2>Welcome back</h2>
        <p className="muted">Sign in to continue</p>
        <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@shanelegance.pk" /></label>
        <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="••••••••" /></label>
        <button className="btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        {import.meta.env.DEV && (
          <div className="demo">
            <div>{DEMO.map(([l, e, p]) => <button type="button" key={l} className="chip" onClick={() => setF({ email: e, password: p })}>{l}</button>)}</div>
          </div>
        )}
      </form>
    </div>
  );
}
