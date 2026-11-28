import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mountain, Bus, BedDouble, MapPinned, GraduationCap, ShieldAlert, ArrowRight, Eye, EyeOff, Lock, Mail, User, Phone, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

const DEMO = [
  ['Admin', 'admin@shanelegance.pk', 'ChangeMe@123'],
  ['Warden', 'warden@shanelegance.pk', 'Skardu@123'],
  ['Driver', 'driver1@shanelegance.pk', 'Skardu@123'],
  ['Student', 'se-012@student.shanelegance.pk', 'Skardu@123']
];

const CLASSES = ['Nursery', 'Prep', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th (FSc)', '12th (FSc)'];

export default function Login({ initialMode = 'login' }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterRoute = location.pathname === '/register' || initialMode === 'register';
  const [isRegister, setIsRegister] = useState(isRegisterRoute);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsRegister(location.pathname === '/register' || initialMode === 'register');
  }, [location.pathname, initialMode]);

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
      toast.success('Registration successful! Please sign in with your email and password.');
      setF({ email: reg.email, password: '' });
      setIsRegister(false);
      navigate('/login');
    } catch (er) {
      toast.error(errMsg(er));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      {/* Left hero banner (desktop) */}
      <div className="login-hero">
        <div className="hero-brand">
          <div className="hero-logo-box">
            <Mountain size={36} color="#fff" />
          </div>
          <div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: 24, fontWeight: 800 }}>Shan Elegance</h2>
            <small style={{ color: '#9fc3d4', fontSize: 13 }}>Public School & Hostel · Skardu</small>
          </div>
        </div>

        <div className="hero-content">
          <h1>Digital Campus &<br />Transport Portal</h1>
          <p>
            Real-time school bus GPS tracking, hostel room allotments, GB-style mess schedules, and online fee payments for parents and students in Skardu.
          </p>
          <ul className="hero-features">
            <li><MapPinned size={20} /> Live GPS Bus Tracking across Skardu Valley</li>
            <li><Bus size={20} /> Verified School Transport & Safe Pick/Drop Routes</li>
            <li><BedDouble size={20} /> Hostel Room Allotments & Mess Management</li>
          </ul>
        </div>

        <div className="hero-footer">
          <small>© {new Date().getFullYear()} Shan Elegance Public School & Hostel, Skardu</small>
        </div>
      </div>

      {/* Right form container */}
      <div className="login-form-area">
        <div className="login-card-wrap">
          <div className="mobile-brand">
            <div className="mobile-logo-box">
              <Mountain size={28} color="#fff" />
            </div>
            <div>
              <b>Shan Elegance</b>
              <small>Public School & Hostel · Skardu</small>
            </div>
          </div>

          {!isRegister ? (
            /* Sign In Form */
            <div className="auth-card">
              <div className="auth-card-head">
                <span className="auth-pill">Official Portal</span>
                <h2>Welcome Back</h2>
                <p>Enter your credentials to access your portal.</p>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <div className="input-group">
                  <label htmlFor="login-email">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="field-icon" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={f.email}
                      onChange={(e) => setF({ ...f, email: e.target.value })}
                      placeholder="student@shanelegance.pk"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="login-password">Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={f.password}
                      onChange={(e) => setF({ ...f, password: e.target.value })}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="pwd-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn primary block auth-btn" disabled={busy}>
                  {busy ? 'Signing in…' : 'Sign In'}
                  {!busy && <ArrowRight size={17} />}
                </button>

                {/* Prominent link directly below the Sign In button to go to Student Register form */}
                <div className="auth-footer-link">
                  <span>Are you a new student?</span>
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => { setIsRegister(true); navigate('/register'); }}
                  >
                    Register as Student
                  </button>
                </div>
              </form>

              {import.meta.env.DEV && (
                <div className="demo-box">
                  <div className="demo-title">Quick Demo Sign-In</div>
                  <div className="demo-chips">
                    {DEMO.map(([l, e, p]) => (
                      <button
                        type="button"
                        key={l}
                        className="demo-chip"
                        onClick={() => setF({ email: e, password: p })}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Student Registration Form */
            <div className="auth-card reg-auth-card">
              <div className="auth-card-head">
                <span className="auth-pill student-pill">
                  <GraduationCap size={15} /> Student Registration
                </span>
                <h2>Register as Student</h2>
                <p>Create your student account to access bus tracking, hostel, and fee slips.</p>
              </div>

              <form onSubmit={handleRegister} className="auth-form">
                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="reg-name">Student Full Name *</label>
                    <div className="input-with-icon">
                      <User size={18} className="field-icon" />
                      <input
                        id="reg-name"
                        required
                        value={reg.name}
                        onChange={(e) => setReg({ ...reg, name: e.target.value })}
                        placeholder="e.g. Ali Haider"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="reg-email">Student Email Address *</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="field-icon" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={reg.email}
                        onChange={(e) => setReg({ ...reg, email: e.target.value })}
                        placeholder="student@shanelegance.pk"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="reg-password">Password (min 6 chars) *</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="field-icon" />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={reg.password}
                        onChange={(e) => setReg({ ...reg, password: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="pwd-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="reg-confirm">Confirm Password *</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="field-icon" />
                      <input
                        id="reg-confirm"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={reg.confirmPassword}
                        onChange={(e) => setReg({ ...reg, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="reg-class">Class / Grade *</label>
                    <div className="input-with-icon">
                      <BookOpen size={18} className="field-icon" />
                      <select
                        id="reg-class"
                        value={reg.className}
                        onChange={(e) => setReg({ ...reg, className: e.target.value })}
                      >
                        {CLASSES.map((c) => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="reg-roll">Roll Number (Optional)</label>
                    <input
                      id="reg-roll"
                      value={reg.rollNo}
                      onChange={(e) => setReg({ ...reg, rollNo: e.target.value })}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="reg-phone">Student Phone</label>
                    <div className="input-with-icon">
                      <Phone size={18} className="field-icon" />
                      <input
                        id="reg-phone"
                        value={reg.phone}
                        onChange={(e) => setReg({ ...reg, phone: e.target.value })}
                        placeholder="03XX-XXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="reg-guardian">Father / Guardian Name</label>
                    <input
                      id="reg-guardian"
                      value={reg.guardianName}
                      onChange={(e) => setReg({ ...reg, guardianName: e.target.value })}
                      placeholder="Guardian Name"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="reg-gphone">Guardian Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={18} className="field-icon" />
                    <input
                      id="reg-gphone"
                      value={reg.guardianPhone}
                      onChange={(e) => setReg({ ...reg, guardianPhone: e.target.value })}
                      placeholder="03XX-XXXXXXX"
                    />
                  </div>
                </div>

                <div className="security-notice">
                  <ShieldAlert size={18} style={{ flexShrink: 0, color: '#0e7490' }} />
                  <div>
                    <strong>Student Only Registration:</strong> Admin, Warden, and Driver accounts are provisioned exclusively by the school administration.
                  </div>
                </div>

                <button type="submit" className="btn primary block auth-btn" disabled={busy}>
                  {busy ? 'Creating Student Account…' : 'Register as Student'}
                  {!busy && <ArrowRight size={17} />}
                </button>

                {/* Prominent link directly below the Register button to return to Sign In */}
                <div className="auth-footer-link">
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => { setIsRegister(false); navigate('/login'); }}
                  >
                    Sign In here
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
