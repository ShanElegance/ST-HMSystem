import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import Transport from './pages/Transport';
import People from './pages/People';
import Hostel from './pages/Hostel';
import Fees from './pages/Fees';
import MessMenu from './pages/MessMenu';
import DriverHome from './pages/DriverHome';

const Guard = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const Home = () => {
  const { user } = useAuth();
  return user.role === 'DRIVER' ? <DriverHome /> : <Dashboard />;
};

export default function App() {
  const S = ['ADMIN', 'WARDEN'];
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login initialMode="register" />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route index element={<Home />} />
        <Route path="map" element={<Guard roles={['ADMIN', 'WARDEN', 'STUDENT']}><LiveMap /></Guard>} />
        <Route path="transport" element={<Guard roles={['ADMIN']}><Transport /></Guard>} />
        <Route path="students" element={<Guard roles={S}><People kind="students" /></Guard>} />
        <Route path="staff" element={<Guard roles={['ADMIN']}><People kind="staff" /></Guard>} />
        <Route path="hostel" element={<Guard roles={S}><Hostel /></Guard>} />
        <Route path="fees" element={<Guard roles={[...S, 'STUDENT']}><Fees /></Guard>} />
        <Route path="menu" element={<Guard roles={[...S, 'STUDENT']}><MessMenu /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
