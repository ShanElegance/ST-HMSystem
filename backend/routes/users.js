const router = require('express').Router();
const User = require('../models/User');
const Bus = require('../models/Bus');
const { protect, allow } = require('../middleware/auth');
router.use(protect, allow('ADMIN', 'WARDEN'));

// Warden may only manage students; admin manages everyone
const canTouch = (actor, role) => actor.role === 'ADMIN' || role === 'STUDENT';

router.get('/', async (req, res) => {
  const q = {};
  const { role, search, noRoom } = req.query;
  if (req.user.role === 'WARDEN') q.role = 'STUDENT';
  else if (role === 'staff') q.role = { $in: ['ADMIN', 'WARDEN', 'DRIVER'] };
  else if (role) q.role = role;
  if (noRoom) q.room = null;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = ['name', 'rollNo', 'email'].map((f) => ({ [f]: rx }));
  }
  res.json(await User.find(q).populate('bus', 'number name').populate('room', 'number floor').sort({ role: 1, name: 1 }));
});

router.post('/', async (req, res) => {
  const b = req.body;
  if (!canTouch(req.user, b.role)) return res.status(403).json({ message: 'Access denied' });
  if (b.role === 'ADMIN') {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    if (adminCount >= 1) return res.status(400).json({ message: 'Only 1 admin is allowed in the system.' });
  }
  if (b.role === 'WARDEN') {
    const wardenCount = await User.countDocuments({ role: 'WARDEN' });
    if (wardenCount >= 1) return res.status(400).json({ message: 'Only 1 warden can be added at a time.' });
  }
  if (b.role === 'DRIVER') {
    const driverCount = await User.countDocuments({ role: 'DRIVER' });
    if (driverCount >= 3) return res.status(400).json({ message: 'Only 3 drivers can be added at a time.' });
  }
  if (b.role !== 'STUDENT' && (!b.password || b.password.length < 6)) {
    return res.status(400).json({ message: 'Password is required for staff (minimum 6 characters)' });
  }
  try {
    const u = await User.create({
      ...b,
      bus: b.bus || null,
      room: b.room || null,
      password: b.password || process.env.DEMO_PASSWORD || 'Skardu@123'
    });
    res.status(201).json(u);
  } catch (e) { res.status(400).json({ message: e.code === 11000 ? 'Email already exists' : e.message }); }
});

router.put('/:id', async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u || (u.role === 'ADMIN' && req.user.role !== 'ADMIN')) return res.status(404).json({ message: 'Not found' });
  if (!canTouch(req.user, u.role)) return res.status(403).json({ message: 'Access denied' });
  const { role, password, _id, __v, createdAt, updatedAt, ...rest } = req.body;
  if (role && role !== u.role) {
    if (role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN', _id: { $ne: u._id } });
      if (adminCount >= 1) return res.status(400).json({ message: 'Only 1 admin is allowed in the system.' });
    }
    if (role === 'WARDEN') {
      const wardenCount = await User.countDocuments({ role: 'WARDEN', _id: { $ne: u._id } });
      if (wardenCount >= 1) return res.status(400).json({ message: 'Only 1 warden can be added at a time.' });
    }
    if (role === 'DRIVER') {
      const driverCount = await User.countDocuments({ role: 'DRIVER', _id: { $ne: u._id } });
      if (driverCount >= 3) return res.status(400).json({ message: 'Only 3 drivers can be added at a time.' });
    }
    u.role = role;
  }
  if ('bus' in rest) rest.bus = rest.bus || null;
  if ('room' in rest) rest.room = rest.room || null;
  Object.assign(u, rest);
  if (password) u.password = password;
  try { await u.save(); res.json(u); } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'Not found' });
  if (u.role === 'ADMIN') return res.status(403).json({ message: 'The primary admin cannot be deleted.' });
  if (!canTouch(req.user, u.role)) return res.status(403).json({ message: 'Access denied' });
  if (u.role === 'DRIVER') await Bus.updateMany({ driver: u._id }, { driver: null });
  await u.deleteOne();
  res.json({ ok: true });
});
module.exports = router;
