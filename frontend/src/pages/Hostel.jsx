import { useState } from 'react';
import { toast } from 'react-toastify';
import { UserMinus, UserPlus } from 'lucide-react';
import { api, errMsg, pkr } from '../api';
import { useFetch } from '../hooks';
import { PageHeader, Modal, Badge, Spinner, Progress } from '../components/ui';

export default function Hostel() {
  const { data: rooms, loading, reload } = useFetch('/rooms');
  const [sel, setSel] = useState(null);
  const [free, setFree] = useState([]);
  const [pick, setPick] = useState('');
  if (loading) return <Spinner />;
  const cur = sel && rooms.find((r) => r._id === sel);
  const open = async (r) => { setSel(r._id); setPick(''); setFree((await api.get('/users?role=STUDENT&noRoom=1')).data); };
  const act = async (fn) => { try { await fn(); await reload(); setFree((await api.get('/users?role=STUDENT&noRoom=1')).data); } catch (e) { toast.error(errMsg(e)); } };
  const beds = rooms.reduce((a, r) => a + r.beds, 0), used = rooms.reduce((a, r) => a + r.occupants.length, 0);
  const tone = (r) => (r.occupants.length === 0 ? 'free' : r.occupants.length >= r.beds ? 'full' : 'part');

  return (
    <>
      <PageHeader title="Hostel Rooms" sub={`${rooms.length} rooms · ${used}/${beds} beds occupied`}>
        <div className="legend"><span className="free" />Vacant<span className="part" />Partly filled<span className="full" />Full</div>
      </PageHeader>
      <div className="card"><Progress value={used} max={beds} tone="amber" /></div>
      {[1, 2, 3].map((f) => (
        <div key={f}>
          <h3 className="floor-title">Floor {f}</h3>
          <div className="room-grid">
            {rooms.filter((r) => r.floor === f).map((r) => (
              <button key={r._id} className={`room ${tone(r)}`} onClick={() => open(r)}>
                <b>{r.number}</b><small>{r.occupants.length}/{r.beds} beds</small><small>{pkr(r.rentPerBed)}/bed</small>
              </button>
            ))}
          </div>
        </div>
      ))}
      {cur && (
        <Modal title={`Room ${cur.number} · Floor ${cur.floor}`} onClose={() => setSel(null)}>
          <p className="muted">{cur.beds}-bed room · <b>{pkr(cur.rentPerBed)}</b> per bed / month</p>
          <div className="tags">{(cur.amenities || []).map((a) => <Badge key={a} tone="teal">{a}</Badge>)}</div>
          <h4>Residents</h4>
          {(!cur.occupants || cur.occupants.length === 0) && <p className="muted">No one yet.</p>}
          {(cur.occupants || []).map((o) => (
            <div className="list-row" key={o._id}><div><b>{o.name}</b><small>{o.rollNo} · {o.className}</small></div>
              <button className="btn ghost sm" onClick={() => act(() => api.post('/rooms/unassign', { studentId: o._id }))}><UserMinus size={15} />Remove</button></div>
          ))}
          {(cur.occupants?.length || 0) < cur.beds && (
            <div className="assign">
              <select value={pick} onChange={(e) => setPick(e.target.value)}><option value="">Select student without a room…</option>{free.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.rollNo})</option>)}</select>
              <button className="btn primary" disabled={!pick} onClick={() => act(async () => { await api.post(`/rooms/${cur._id}/assign`, { studentId: pick }); setPick(''); })}><UserPlus size={16} />Assign</button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
