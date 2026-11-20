import { Fragment, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BUS_COLORS, SCHOOL, SKARDU } from '../constants';
import { fmtTime } from '../api';

const busIcon = (color, label) => L.divIcon({
  className: '',
  html: `<div class="bus-pin" style="background:${color}"><span>🚌</span><b>${label}</b></div>`,
  iconSize: [64, 30], iconAnchor: [32, 15],
});
const schoolIcon = L.divIcon({ className: '', html: '<div class="school-pin">🏫</div>', iconSize: [36, 36], iconAnchor: [18, 18] });

function Fly({ target }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo(target, 15, { duration: 1 }); }, [target]); // eslint-disable-line
  return null;
}

export default function BusMap({ buses, focus, height = 540, me }) {
  return (
    <MapContainer center={SKARDU} zoom={12} style={{ height, width: '100%' }} scrollWheelZoom>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[SCHOOL.lat, SCHOOL.lng]} icon={schoolIcon}><Popup><b>{SCHOOL.name}</b><br />Skardu, Gilgit-Baltistan</Popup></Marker>
      {buses.map((b, i) => {
        const color = BUS_COLORS[i % BUS_COLORS.length];
        return (
          <Fragment key={b._id}>
            <Polyline positions={(b.stops || []).map((s) => [s.lat, s.lng])} pathOptions={{ color, weight: 4, opacity: 0.55, dashArray: '8 8' }} />
            {(b.stops || []).slice(0, -1).map((s) => (
              <CircleMarker key={`${s.name}-${s.lat}`} center={[s.lat, s.lng]} radius={6} pathOptions={{ color, fillColor: '#fff', fillOpacity: 1, weight: 3 }}>
                <Tooltip>{s.name} · {s.pickupTime}</Tooltip>
              </CircleMarker>
            ))}
            {b.location?.lat && (
              <Marker position={[b.location.lat, b.location.lng]} icon={busIcon(color, b.number)}>
                <Popup>
                  <b>{b.name}</b><br />Driver: {b.driver?.name || '—'}<br />Speed: {b.location.speed || 0} km/h<br />
                  Updated: {fmtTime(b.location.updatedAt)} {b.location.live ? '(GPS)' : '(demo)'}
                </Popup>
              </Marker>
            )}
          </Fragment>
        );
      })}
      {me && <CircleMarker center={me} radius={9} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9 }}><Tooltip>You</Tooltip></CircleMarker>}
      <Fly target={focus} />
    </MapContainer>
  );
}
