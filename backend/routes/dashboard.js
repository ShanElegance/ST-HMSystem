const router = require('express').Router();
const User = require('../models/User');
const Bus = require('../models/Bus');
const Room = require('../models/Room');
const Fee = require('../models/Fee');
const { protect, allow } = require('../middleware/auth');

router.get('/', protect, allow('ADMIN', 'WARDEN'), async (req, res) => {
  const month = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }).slice(0, 7);
  const [students, hostelers, riders, rooms, occ, feeAgg, buses, busCounts, unpaid] = await Promise.all([
    User.countDocuments({ role: 'STUDENT' }),
    User.countDocuments({ role: 'STUDENT', room: { $ne: null } }),
    User.countDocuments({ role: 'STUDENT', bus: { $ne: null } }),
    Room.find().lean(),
    User.aggregate([{ $match: { room: { $ne: null } } }, { $group: { _id: '$room', n: { $sum: 1 } } }]),
    Fee.aggregate([{ $match: { month } }, { $group: { _id: '$status', total: { $sum: '$amount' } } }]),
    Bus.find().populate('driver', 'name phone').lean(),
    User.aggregate([{ $match: { role: 'STUDENT', bus: { $ne: null } } }, { $group: { _id: '$bus', n: { $sum: 1 } } }]),
    Fee.find({ status: 'UNPAID' }).sort({ createdAt: -1 }).limit(6).populate('student', 'name rollNo'),
  ]);
  const occMap = Object.fromEntries(occ.map((o) => [String(o._id), o.n]));
  const floors = {};
  rooms.forEach((r) => {
    const f = (floors[r.floor] ||= { floor: r.floor, beds: 0, occupied: 0, rooms: 0 });
    f.beds += r.beds; f.occupied += occMap[String(r._id)] || 0; f.rooms++;
  });
  const money = Object.fromEntries(feeAgg.map((f) => [f._id, f.total]));
  const cm = Object.fromEntries(busCounts.map((c) => [String(c._id), c.n]));
  res.json({
    month, students, hostelers, riders,
    totalRooms: rooms.length,
    totalBeds: rooms.reduce((a, r) => a + r.beds, 0),
    occupiedBeds: occ.reduce((a, o) => a + o.n, 0),
    floors: Object.values(floors),
    collected: money.PAID || 0, pending: money.UNPAID || 0,
    buses: buses.map((b) => ({ ...b, riders: cm[String(b._id)] || 0 })),
    unpaid,
  });
});
module.exports = router;
