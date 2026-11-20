import { useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { api, errMsg } from '../api';
import { useFetch } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Badge, Spinner, Empty } from '../components/ui';

const blank = (kind, defaultRole = 'DRIVER') => (kind === 'students'
  ? { role: 'STUDENT', name: '', email: '', phone: '', rollNo: '', className: '6th', guardianName: '', guardianPhone: '', bus: '', pickupStop: '' }
  : { role: defaultRole, name: '', email: '', phone: '', licenseNo: '', password: '' });

export default function People({ kind }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const url = kind === 'students' ? `/users?role=STUDENT&search=${encodeURIComponent(search)}` : '/users?role=staff';
  const { data, loading, reload } = useFetch(url, [kind, search]);
  const { data: buses } = useFetch('/buses');
  const [form, setForm] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const stops = buses?.find((b) => b._id === form?.bus)?.stops?.slice(0, -1) || [];

  const driverCount = data?.filter((u) => u.role === 'DRIVER').length || 0;
  const adminCount = data?.filter((u) => u.role === 'ADMIN').length || 0;
  const wardenCount = data?.filter((u) => u.role === 'WARDEN').length || 0;
  const defaultStaffRole = driverCount < 3 ? 'DRIVER' : wardenCount < 1 ? 'WARDEN' : adminCount < 1 ? 'ADMIN' : 'DRIVER';

  const save = async (e) => {
    e.preventDefault();
    if (kind === 'staff' && !form._id) {
      if (form.role === 'DRIVER' && driverCount >= 3) {
        return toast.error('Maximum 3 drivers allowed. You cannot add more drivers.');
      }
      if (form.role === 'WARDEN' && wardenCount >= 1) {
        return toast.error('Maximum 1 warden allowed. Only 1 warden can exist at a time.');
      }
      if (form.role === 'ADMIN' && adminCount >= 1) {
        return toast.error('Maximum 1 admin allowed. Only 1 admin can exist at a time.');
      }
    }
    try {
      const payload = { ...form };
      if (payload.bus === '') payload.bus = null;
      if (payload.room === '') payload.room = null;
      if (!payload.password) delete payload.password;
      form._id ? await api.put(`/users/${form._id}`, payload) : await api.post('/users', payload);
      toast.success('Saved'); setForm(null); reload();
    } catch (er) { toast.error(errMsg(er)); }
  };
  const remove = async (p) => {
    if (p.role === 'ADMIN') return toast.error('The primary admin cannot be removed.');
    if (!confirm(`Remove ${p.name}?`)) return;
    try { await api.delete(`/users/${p._id}`); toast.success('Removed'); reload(); } catch (er) { toast.error(errMsg(er)); }
  };

  return (
    <>
      <PageHeader
        title={kind === 'students' ? 'Students' : 'Staff'}
        sub={kind === 'students' ? 'Admissions, transport and hostel status' : `Staff management · Drivers: ${driverCount}/3 · Warden: ${wardenCount}/1 · Admin: ${adminCount}/1`}
      >
        {kind === 'students' && <div className="search"><Search size={16} /><input placeholder="Search name / roll no" value={search} onChange={(e) => setSearch(e.target.value)} /></div>}
        <button className="btn primary" onClick={() => setForm(blank(kind, defaultStaffRole))}><Plus size={16} />Add {kind === 'students' ? 'student' : 'staff'}</button>
      </PageHeader>
      <div className="card table-wrap">
        {loading ? <Spinner /> : !data?.length ? <Empty>Nothing found</Empty> : kind === 'students' ? (
          <table><thead><tr><th>Student</th><th>Class</th><th>Guardian</th><th>Hostel</th><th>Bus / pickup</th><th /></tr></thead>
            <tbody>{data.map((s) => (
              <tr key={s._id}><td><b>{s.name}</b><small>{s.rollNo}</small></td><td>{s.className}</td><td>{s.guardianName}<small>{s.guardianPhone}</small></td>
                <td>{s.room ? <Badge tone="amber">Room {s.room.number}</Badge> : <Badge>Day scholar</Badge>}</td>
                <td>{s.bus ? <><Badge tone="teal">{s.bus.number}</Badge><small>{s.pickupStop}</small></> : '—'}</td>
                <td className="row-actions"><button className="icon-btn" onClick={() => setForm({ ...s, bus: s.bus?._id || '', room: s.room?._id || '' })}><Pencil size={16} /></button>
                  <button className="icon-btn danger" onClick={() => remove(s)}><Trash2 size={16} /></button></td></tr>))}</tbody></table>
        ) : (
          <table><thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Licence</th><th /></tr></thead>
            <tbody>{data.map((s) => (
              <tr key={s._id}><td><b>{s.name}</b></td><td><Badge tone={s.role === 'ADMIN' ? 'violet' : s.role === 'WARDEN' ? 'amber' : 'teal'}>{s.role}</Badge></td><td>{s.phone}</td><td>{s.email}</td><td>{s.licenseNo || '—'}</td>
                <td className="row-actions"><button className="icon-btn" onClick={() => setForm(s)}><Pencil size={16} /></button>
                  {s.role !== 'ADMIN' ? (
                    <button className="icon-btn danger" onClick={() => remove(s)} title="Remove"><Trash2 size={16} /></button>
                  ) : (
                    <span className="icon-btn" style={{ opacity: 0.35, cursor: 'not-allowed' }} title="Admin cannot be removed"><Trash2 size={16} /></span>
                  )}
                </td></tr>))}</tbody></table>
        )}
      </div>
      {form && (
        <Modal title={form._id ? 'Edit' : 'Add new'} onClose={() => setForm(null)} wide>
          <form onSubmit={save} className="form two">
            <label>Full name<input required value={form.name} onChange={set('name')} /></label>
            <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
            <label>Phone (+92)<input value={form.phone || ''} onChange={set('phone')} placeholder="+92 355 0000000" /></label>
            {kind === 'staff' && !form._id && (
              <label>
                Role
                <select value={form.role} onChange={set('role')}>
                  <option value="DRIVER" disabled={driverCount >= 3}>
                    DRIVER {driverCount >= 3 ? '(Limit: 3 reached)' : ''}
                  </option>
                  <option value="WARDEN" disabled={wardenCount >= 1}>
                    WARDEN {wardenCount >= 1 ? '(Limit: 1 reached)' : ''}
                  </option>
                  <option value="ADMIN" disabled={adminCount >= 1}>
                    ADMIN {adminCount >= 1 ? '(Limit: 1 reached)' : ''}
                  </option>
                </select>
              </label>
            )}
            {kind === 'staff' && form.role === 'DRIVER' && <label>Licence no (drivers)<input value={form.licenseNo || ''} onChange={set('licenseNo')} /></label>}
            {kind === 'staff' && (
              <label>
                {form._id ? 'New password (optional)' : 'Password'}
                <input
                  type="password"
                  required={!form._id}
                  minLength={6}
                  value={form.password || ''}
                  onChange={set('password')}
                  placeholder={form._id ? 'Leave blank to keep unchanged' : 'Minimum 6 characters'}
                />
              </label>
            )}
            {kind === 'staff' && !form._id && form.role === 'DRIVER' && driverCount >= 3 && (
              <p className="full muted" style={{ color: '#dc2626' }}>Maximum 3 drivers already exist. Only 3 drivers can be added.</p>
            )}
            {kind === 'staff' && !form._id && form.role === 'WARDEN' && wardenCount >= 1 && (
              <p className="full muted" style={{ color: '#dc2626' }}>A warden already exists. Only 1 warden can be added.</p>
            )}
            {kind === 'staff' && !form._id && form.role === 'ADMIN' && adminCount >= 1 && (
              <p className="full muted" style={{ color: '#dc2626' }}>An admin already exists. Only 1 admin can be added.</p>
            )}
            {kind === 'students' && (<>
              <label>Roll no<input value={form.rollNo || ''} onChange={set('rollNo')} /></label>
              <label>Class<input value={form.className || ''} onChange={set('className')} /></label>
              <label>Guardian name<input value={form.guardianName || ''} onChange={set('guardianName')} /></label>
              <label>Guardian phone<input value={form.guardianPhone || ''} onChange={set('guardianPhone')} /></label>
              {user.role && <>
                <label>School bus<select value={form.bus || ''} onChange={(e) => setForm({ ...form, bus: e.target.value, pickupStop: '' })}><option value="">No bus (self / hostel)</option>{buses?.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></label>
                <label>Pickup stop<select value={form.pickupStop || ''} disabled={!form.bus} onChange={set('pickupStop')}><option value="">—</option>{stops.map((s) => <option key={s.name}>{s.name}</option>)}</select></label></>}
            </>)}
            {kind === 'students' && !form._id && <p className="muted full">Default password: <code>Skardu@123</code> (ask them to change it).</p>}
            <button
              className="btn primary full"
              disabled={
                kind === 'staff' &&
                !form._id &&
                ((form.role === 'DRIVER' && driverCount >= 3) ||
                  (form.role === 'WARDEN' && wardenCount >= 1) ||
                  (form.role === 'ADMIN' && adminCount >= 1))
              }
            >
              Save
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
