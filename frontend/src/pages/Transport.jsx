import { useState } from 'react';
import { toast } from 'react-toastify';
import { Users, Pencil } from 'lucide-react';
import { api, errMsg, pkr } from '../api';
import { useFetch } from '../hooks';
import { PageHeader, Modal, Progress, Spinner, Badge } from '../components/ui';
import { BUS_COLORS } from '../constants';

export default function Transport() {
  const { data: buses, loading, reload } = useFetch('/buses');
  const { data: drivers } = useFetch('/users?role=DRIVER');
  const [riders, setRiders] = useState(null);
  const [edit, setEdit] = useState(null);
  if (loading) return <Spinner />;
  const showRiders = async (b) => setRiders({ bus: b, list: (await api.get(`/buses/${b._id}/riders`)).data });
  const save = async (e) => {
    e.preventDefault();
    try { await api.put(`/buses/${edit._id}`, { ...edit, driver: edit.driver?._id || edit.driver }); toast.success('Bus updated'); setEdit(null); reload(); } catch (er) { toast.error(errMsg(er)); }
  };
  return (
    <>
      <PageHeader title="Transport" sub="Fleet, drivers, routes and pickup timings" />
      <div className="grid-3">
        {buses.map((b, i) => (
          <div className="card bus-card" key={b._id} style={{ borderTop: `4px solid ${BUS_COLORS[i % 4]}` }}>
            <div className="between"><h3>{b.name}</h3><Badge tone="teal">{b.number}</Badge></div>
            <p className="muted">Driver: <b>{b.driver?.name || 'Unassigned'}</b> {b.driver?.phone}</p>
            <p className="muted">Monthly fare: <b>{pkr(b.monthlyFee)}</b></p>
            <Progress value={b.riders} max={b.capacity} tone="violet" /><small>{b.riders}/{b.capacity} seats used</small>
            <ol className="timeline">{(b.stops || []).map((s) => <li key={s.name}><b>{s.pickupTime}</b> {s.name}</li>)}</ol>
            <div className="between"><button className="btn ghost sm" onClick={() => showRiders(b)}><Users size={15} />Riders</button>
              <button className="btn ghost sm" onClick={() => setEdit(b)}><Pencil size={15} />Edit</button></div>
          </div>
        ))}
      </div>
      {riders && (
        <Modal title={`${riders.bus.name} – riders`} onClose={() => setRiders(null)}>
          <table><thead><tr><th>Name</th><th>Class</th><th>Pickup stop</th><th>Guardian</th></tr></thead>
            <tbody>{riders.list.map((r) => <tr key={r._id}><td>{r.name}<small> {r.rollNo}</small></td><td>{r.className}</td><td>{r.pickupStop}</td><td>{r.guardianPhone}</td></tr>)}</tbody></table>
        </Modal>
      )}
      {edit && (
        <Modal title="Edit bus" onClose={() => setEdit(null)}>
          <form onSubmit={save} className="form">
            <label>Display name<input value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label>Driver<select value={edit.driver?._id || edit.driver || ''} onChange={(e) => setEdit({ ...edit, driver: e.target.value })}>
              <option value="">— Unassigned —</option>{(drivers || []).map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></label>
            <label>Monthly fare (Rs)<input type="number" min="0" value={edit.monthlyFee} onChange={(e) => setEdit({ ...edit, monthlyFee: +e.target.value })} /></label>
            <label>Capacity<input type="number" min="1" value={edit.capacity} onChange={(e) => setEdit({ ...edit, capacity: +e.target.value })} /></label>
            <button className="btn primary">Save</button>
          </form>
        </Modal>
      )}
    </>
  );
}
