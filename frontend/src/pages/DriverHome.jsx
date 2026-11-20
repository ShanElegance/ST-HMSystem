import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Radio, Square, Users } from 'lucide-react';
import { api } from '../api';
import { useFetch, useSocket } from '../hooks';
import { PageHeader, Badge, Spinner } from '../components/ui';
import BusMap from '../components/BusMap';

export default function DriverHome() {
  const { data: buses, loading } = useFetch('/buses');
  const bus = buses?.[0];
  const { data: riders } = useFetch(bus ? `/buses/${bus._id}/riders` : null, [bus?._id]);
  const sock = useSocket();
  const [sharing, setSharing] = useState(false);
  const [pos, setPos] = useState(null);
  const watch = useRef(null);

  const start = () => {
    if (!navigator.geolocation) return toast.error('GPS not supported on this device');
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude, speed: (p.coords.speed || 0) * 3.6 };
        setPos(c); sock.current?.emit('bus:location', c);
      },
      () => { toast.error('Please allow location access'); stop(); },
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
    setSharing(true);
  };
  const stop = () => { navigator.geolocation.clearWatch(watch.current); setSharing(false); };
  useEffect(() => () => watch.current && navigator.geolocation.clearWatch(watch.current), []);

  if (loading) return <Spinner />;
  if (!bus) return <><PageHeader title="My Bus" /><div className="card">No bus is assigned to you yet. Please contact the admin.</div></>;
  const withPos = pos ? { ...bus, location: { ...pos, updatedAt: new Date(), live: true } } : bus;
  return (
    <>
      <PageHeader title={bus.name} sub={`${bus.number} · ${bus.routeName}`}>
        {sharing ? <button className="btn danger" onClick={stop}><Square size={16} />Stop sharing</button>
          : <button className="btn primary" onClick={start}><Radio size={16} />Start sharing location</button>}
        <Badge tone={sharing ? 'green' : 'gray'}>{sharing ? '● Broadcasting GPS' : 'Not sharing'}</Badge>
      </PageHeader>
      <div className="map-layout">
        <div className="card map-card"><BusMap buses={[withPos]} height={460} /></div>
        <div className="side-list">
          <div className="card"><h3>Today's route</h3><ol className="timeline">{(bus.stops || []).map((s) => <li key={s.name}><b>{s.pickupTime}</b> {s.name}</li>)}</ol></div>
          <div className="card"><h3><Users size={17} /> Students ({riders?.length || 0})</h3>
            {(riders || []).map((r) => <div className="list-row" key={r._id}><div><b>{r.name}</b><small>{r.pickupStop}</small></div></div>)}</div>
        </div>
      </div>
    </>
  );
}
