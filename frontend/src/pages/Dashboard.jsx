import { Link } from 'react-router-dom';
import { GraduationCap, BedDouble, Bus, Wallet, MapPin, Phone, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks';
import { pkr, monthLabel } from '../api';
import { PageHeader, Stat, Progress, Badge, Spinner, Empty } from '../components/ui';
import { FEE_LABEL } from '../constants';

function StudentDash() {
  const { user } = useAuth();
  const { data: fees, loading } = useFetch('/fees');
  if (loading) return <Spinner />;
  const unpaid = (fees || []).filter((f) => f.status === 'UNPAID');
  return (
    <>
      <PageHeader title={`Assalam-o-Alaikum, ${user.name.split(' ')[0]}`} sub={`${user.className || ''} · Roll No ${user.rollNo || '—'}`} />
      <div className="grid-3">
        <div className="card">
          <h3><Bus size={18} /> My bus</h3>
          {user.bus ? (<><p className="big">{user.bus.name}</p><p className="muted">{user.bus.number} · Pickup: {user.pickupStop}</p>
            <p className="muted"><Phone size={14} /> {user.bus.driver?.name} {user.bus.driver?.phone}</p><Link to="/map" className="btn primary sm"><MapPin size={15} />Track live</Link></>) : <Empty>No bus assigned</Empty>}
        </div>
        <div className="card">
          <h3><BedDouble size={18} /> My hostel room</h3>
          {user?.room ? (<><p className="big">Room {user.room.number}</p><p className="muted">Floor {user.room.floor} · {user.room.beds} beds</p>
            <div className="tags">{(user.room.amenities || []).map((a) => <Badge key={a} tone="teal">{a}</Badge>)}</div></>) : <Empty>Day scholar — no hostel room</Empty>}
        </div>
        <div className="card">
          <h3><Wallet size={18} /> Pending fees</h3>
          <p className="big">{pkr(unpaid.reduce((a, f) => a + f.amount, 0))}</p>
          <p className="muted">{unpaid.length} unpaid item(s)</p>
          <Link to="/fees" className="btn ghost sm">View fees</Link>
        </div>
      </div>
      <Link to="/menu" className="btn ghost"><UtensilsCrossed size={16} />Today's mess menu</Link>
    </>
  );
}

function StaffDash() {
  const { data: d, loading } = useFetch('/dashboard');
  if (loading || !d) return <Spinner />;
  const total = d.collected + d.pending;
  return (
    <>
      <PageHeader title="Dashboard" sub={`Overview for ${monthLabel(d.month)} · Skardu campus`} />
      <div className="grid-4">
        <Stat icon={GraduationCap} label="Students" value={d.students} hint={`${d.riders} use school bus`} />
        <Stat icon={BedDouble} label="Hostel beds filled" value={`${d.occupiedBeds}/${d.totalBeds}`} hint={`${d.totalRooms} rooms · ${d.hostelers} residents`} tone="amber" />
        <Stat icon={Bus} label="Buses on road" value={d.buses.length} hint="Live tracking active" tone="violet" />
        <Stat icon={Wallet} label="Fees collected" value={pkr(d.collected)} hint={`${pkr(d.pending)} pending`} tone="green" />
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>Hostel occupancy by floor</h3>
          {(d.floors || []).map((f) => (
            <div key={f.floor} className="row-bar">
              <span>Floor {f.floor} <small>({f.rooms} rooms)</small></span>
              <Progress value={f.occupied} max={f.beds} tone="amber" />
              <b>{f.occupied}/{f.beds}</b>
            </div>
          ))}
          <h3 style={{ marginTop: 22 }}>This month's fee collection</h3>
          <Progress value={d.collected} max={total} tone="green" />
          <p className="muted">{total ? Math.round((d.collected / total) * 100) : 0}% of {pkr(total)} collected</p>
        </div>
        <div className="card">
          <h3>Fleet status</h3>
          {(d.buses || []).map((b) => (
            <div key={b._id} className="list-row">
              <div><b>{b.name}</b><small>{b.number} · Driver {b.driver?.name || '—'}</small></div>
              <div className="right"><Badge tone="green">● Live</Badge><small>{b.riders || 0}/{b.capacity} seats</small></div>
            </div>
          ))}
          <Link to="/map" className="btn primary sm" style={{ marginTop: 12 }}><MapPin size={15} />Open live map</Link>
        </div>
      </div>
      <div className="card">
        <h3>Recent unpaid fees</h3>
        {!d.unpaid?.length ? <Empty>No pending dues. Generate this month's fees from the Fees page.</Empty> : (
          <table><thead><tr><th>Student</th><th>Roll No</th><th>Type</th><th>Month</th><th>Amount</th></tr></thead>
            <tbody>{d.unpaid.map((f) => <tr key={f._id}><td>{f.student?.name}</td><td>{f.student?.rollNo}</td><td>{FEE_LABEL[f.type]}</td><td>{f.month}</td><td>{pkr(f.amount)}</td></tr>)}</tbody></table>
        )}
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return user.role === 'STUDENT' ? <StudentDash /> : <StaffDash />;
}
