import { useState } from 'react';
import { useLiveBuses } from '../hooks';
import { BUS_COLORS } from '../constants';
import { fmtTime } from '../api';
import { PageHeader, Badge, Spinner, Empty } from '../components/ui';
import BusMap from '../components/BusMap';

export default function LiveMap() {
  const { buses, loading } = useLiveBuses();
  const [focus, setFocus] = useState(null);
  if (loading) return <Spinner />;
  if (!buses.length) return <><PageHeader title="Live Map" /><Empty>No bus assigned to you yet.</Empty></>;
  return (
    <>
      <PageHeader title="Live Bus Tracking" sub="Skardu city · positions update in real time" />
      <div className="map-layout">
        <div className="card map-card"><BusMap buses={buses} focus={focus} height={560} /></div>
        <div className="side-list">
          {buses.map((b, i) => (
            <button key={b._id} className="card bus-item" onClick={() => b.location?.lat && setFocus([b.location.lat, b.location.lng])}>
              <span className="dot" style={{ background: BUS_COLORS[i % 4] }} />
              <div><b>{b.name}</b><small>{b.number} · {b.driver?.name}</small>
                <small>{b.location?.speed || 0} km/h · {fmtTime(b.location?.updatedAt)}</small>
                <div className="stops">{(b.stops || []).map((s) => `${s.pickupTime} ${s.name}`).join(' → ')}</div></div>
              <Badge tone={b.location?.live ? 'green' : 'amber'}>{b.location?.live ? 'GPS' : 'Demo'}</Badge>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
