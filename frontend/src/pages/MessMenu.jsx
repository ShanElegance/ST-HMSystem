import { useState } from 'react';
import { toast } from 'react-toastify';
import { Pencil, Sunrise, Sun, Moon } from 'lucide-react';
import { api, errMsg } from '../api';
import { useFetch } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Badge, Spinner } from '../components/ui';

export default function MessMenu() {
  const { user } = useAuth();
  const { data, loading, reload } = useFetch('/menu');
  const [edit, setEdit] = useState(null);
  if (loading) return <Spinner />;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Karachi' });
  const save = async (e) => {
    e.preventDefault();
    try { await api.put(`/menu/${edit._id}`, edit); toast.success('Menu updated'); setEdit(null); reload(); } catch (er) { toast.error(errMsg(er)); }
  };
  return (
    <>
      <PageHeader title="Hostel Mess Menu" sub="Weekly menu with local Balti favourites" />
      <div className="menu-grid">
        {!data?.length ? <p className="muted">No mess menu has been set up yet.</p> : data.map((m) => (
          <div key={m._id} className={`card menu-card ${m.day === today ? 'today' : ''}`}>
            <div className="between"><h3>{m.day}</h3>{m.day === today && <Badge tone="green">Today</Badge>}
              {user.role !== 'STUDENT' && <button className="icon-btn" onClick={() => setEdit(m)}><Pencil size={15} /></button>}</div>
            <p><Sunrise size={15} /> <b>Breakfast</b><br />{m.breakfast}</p>
            <p><Sun size={15} /> <b>Lunch</b><br />{m.lunch}</p>
            <p><Moon size={15} /> <b>Dinner</b><br />{m.dinner}</p>
          </div>
        ))}
      </div>
      {edit && (
        <Modal title={`Edit ${edit.day}`} onClose={() => setEdit(null)}>
          <form className="form" onSubmit={save}>
            {['breakfast', 'lunch', 'dinner'].map((k) => <label key={k} style={{ textTransform: 'capitalize' }}>{k}<textarea rows={2} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></label>)}
            <button className="btn primary">Save</button>
          </form>
        </Modal>
      )}
    </>
  );
}
