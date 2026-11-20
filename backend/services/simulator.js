// Demo helper: drives each bus along its stops so the live map is alive without real GPS.
// Pauses automatically for 60s whenever a real driver is sharing location.
const Bus = require('../models/Bus');
const { applyLocation, lastReal } = require('./location');
module.exports = (io) => {
  const state = {};
  setInterval(async () => {
    try {
      const buses = await Bus.find();
      for (const bus of buses) {
        if (!bus.stops || bus.stops.length < 2) continue;
        if (Date.now() - (lastReal.get(String(bus._id)) || 0) < 60000) continue;
        const s = (state[bus.id] ||= { i: 0, t: 0 });
        s.t += 0.07;
        if (s.t >= 1 || s.i >= bus.stops.length) { s.t = 0; s.i = (s.i + 1) % bus.stops.length; }
        const a = bus.stops[s.i], b = bus.stops[(s.i + 1) % bus.stops.length];
        if (!a || !b) continue;
        await applyLocation(io, bus, {
          lat: a.lat + (b.lat - a.lat) * s.t,
          lng: a.lng + (b.lng - a.lng) * s.t,
          speed: 24 + Math.round(Math.random() * 14),
        }, false);
      }
    } catch (e) { console.error('sim', e.message); }
  }, 3000);
};
