const Bus = require('../models/Bus');
const lastReal = new Map();
exports.lastReal = lastReal;
exports.applyLocation = async (io, bus, { lat, lng, speed = 0 }, live = false) => {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
  bus.location = { lat, lng, speed, updatedAt: new Date(), live };
  await Bus.updateOne({ _id: bus._id }, { location: bus.location });
  if (live) lastReal.set(String(bus._id), Date.now());
  if (io) io.to('staff').to(`bus:${bus._id}`).emit('bus:update', { _id: bus._id, location: bus.location });
};
