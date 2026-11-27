import { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mountain, Bus, BedDouble, MapPinned, GraduationCap, UserPlus, LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

const DEMO = [
  ['Admin', 'admin@shanelegance.pk', 'ChangeMe@123'],
  ['Warden', 'warden@shanelegance.pk', 'Skardu@123'],
  ['Driver', 'driver1@shanelegance.pk', 'Skardu@123'],
  ['Student', 'se-012@student.shanelegance.pk', 'Skardu@123']
];

const CLASSES = ['6th', '7th', '8th', '9th', '10th', '11th (FSc)', '12th (FSc)'];

export default function Login({ initialMode = 'login' }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterRoute = location.pathname === '/register' || initialMode === 'register';
  const [isRegister, setIsRegister] = useState(isRegisterRoute);
  const [busy, setBusy] = useState(false);

  // Login form state
  const [f, setF] = useState({ email: '', password: '' });

  // Student registration form state (Strictly STUDENT role)
  const [reg, setReg] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    className: '6th',
    rollNo: '',
    guardianName: '',
    guardianPhone: '',
  });

  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(f.email, f.password);
      toast.success('Signed in successfully');
    } catch (er) {
      toast.error(errMsg(er));
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (reg.password.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }
    if (reg.password !== reg.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setBusy(true);
    try {
      await register({
        name: reg.name,
        email: reg.email,
        password: reg.password,
        phone: reg.phone,
        className: reg.className,
        rollNo: reg.rollNo,
        guardianName: reg.guardianName,
        guardianPhone: reg.guardianPhone,
      });
      toast.success('Registration successful! Welcome to Shan Elegance.');
    } catch (er) {
      toast.error(errMsg(er));
    } finally {
      setBusy(false);
    }
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
          <li><BedDouble size={18} /> 30 hostel rooms with GB-style mess</li>
        </ul>
      </div>

      <div className="login-card-wrap">
        <div className="mobile-brand">
          <Mountain size={32} />
          <div>
            <b>Shan Elegance</b>
            <small>Skardu · Gilgit-Baltistan</small>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); navigate('/login'); }}
          >
            <LogIn size={16} /> Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); navigate('/register'); }}
          >
            <GraduationCap size={16} /> Student Register
          </button>
        </div>

        {!isRegister ? (
          <form className="login-card" onSubmit={handleLogin}>
            <h2>Welcome back</h2>
            <p className="muted">Sign in to your account</p>
            <label>
              Email address
              <input
                type="email"
                required
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
                placeholder="you@shanelegance.pk"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
                placeholder="••••••••"
              />
            </label>
            <button className="btn primary block" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="auth-switch">
              <span>New student?</span>{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => { setIsRegister(true); navigate('/register'); }}
              >
                Create student account
              </button>
            </div>

            {import.meta.env.DEV && (
              <div className="demo">
                <small className="muted">Demo Accounts (click to fill)</small>
                <div>
                  {DEMO.map(([l, e, p]) => (
                    <button type="button" key={l} className="chip" onClick={() => setF({ email: e, password: p })}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : (
          <form className="login-card reg-card" onSubmit={handleRegister}>
            <div className="student-only-badge">
              <GraduationCap size={17} /> Student Registration Only
            </div>
            <h2>Create Student Account</h2>
            <p className="muted">Register to access bus tracking, hostel, and fees.</p>

            <div className="form-grid-2">
              <label>
                Full Name *
                <input
                  required
                  value={reg.name}
                  onChange={(e) => setReg({ ...reg, name: e.target.value })}
                  placeholder="e.g. Ali Haider"
                />
              </label>
              <label>
                Email Address *
                <input
                  type="email"
                  required
                  value={reg.email}
                  onChange={(e) => setReg({ ...reg, email: e.target.value })}
                  placeholder="student@shanelegance.pk"
                />
              </label>
            </div>

            <div className="form-grid-2">
              <label>
                Password (min 6 chars) *
                <input
                  type="password"
                  required
                  minLength={6}
                  value={reg.password}
                  onChange={(e) => setReg({ ...reg, password: e.target.value })}
                  placeholder="••••••••"
                />
              </label>
              <label>
                Confirm Password *
                <input
                  type="password"
                  required
                  minLength={6}
                  value={reg.confirmPassword}
                  onChange={(e) => setReg({ ...reg, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </label>
            </div>

            <div className="form-grid-2">
              <label>
                Class *
                <select
                  value={reg.className}
                  onChange={(e) => setReg({ ...reg, className: e.target.value })}
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Roll Number (Optional)
                <input
                  value={reg.rollNo}
                  onChange={(e) => setReg({ ...reg, rollNo: e.target.value })}
                  placeholder="Auto-assigned if empty"
                />
              </label>
            </div>

            <div className="form-grid-2">
              <label>
                Student Phone (+92)
                <input
                  value={reg.phone}
                  onChange={(e) => setReg({ ...reg, phone: e.target.value })}
                  placeholder="+92 355 0000000"
                />
              </label>
              <label>
                Guardian Name
                <input
                  value={reg.guardianName}
                  onChange={(e) => setReg({ ...reg, guardianName: e.target.value })}
                  placeholder="Father / Guardian Name"
                />
              </label>
            </div>

            <label>
              Guardian Phone
              <input
                value={reg.guardianPhone}
                onChange={(e) => setReg({ ...reg, guardianPhone: e.target.value })}
                placeholder="+92 355 0000000"
              />
            </label>

            <div className="security-notice">
              <ShieldAlert size={16} />
              <span>
                <strong>Security Policy:</strong> This portal registration creates <strong>Student accounts only</strong>. Admin, Warden, and Driver accounts are managed exclusively by the school administration.
              </span>
            </div>

            <button className="btn primary block" disabled={busy}>
              {busy ? 'Creating account…' : 'Complete Registration'}
            </button>

            <div className="auth-switch">
              <span>Already registered?</span>{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => { setIsRegister(false); navigate('/login'); }}
              >
                Sign in here
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
