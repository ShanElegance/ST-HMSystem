const router = require('express').Router();
const Bus = require('../models/Bus');
const User = require('../models/User');
const { protect, allow } = require('../middleware/auth');
const { applyLocation } = require('../services/location');
router.use(protect);

router.get('/', async (req, res) => {
  const q = {};
  if (req.user.role === 'DRIVER') q.driver = req.user._id;
  if (req.user.role === 'STUDENT') q._id = req.user.bus || null;
  const buses = await Bus.find(q).populate('driver', 'name phone licenseNo').sort({ number: 1 }).lean();
  const counts = await User.aggregate([{ $match: { role: 'STUDENT', bus: { $ne: null } } }, { $group: { _id: '$bus', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(buses.map((b) => ({ ...b, riders: map[String(b._id)] || 0 })));
});

router.get('/:id/riders', allow('ADMIN', 'WARDEN', 'DRIVER'), async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'DRIVER' && String(bus.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Access denied' });
  res.json(await User.find({ role: 'STUDENT', bus: bus._id }).select('name rollNo className pickupStop guardianPhone').sort({ pickupStop: 1 }));
});

router.put('/:id', allow('ADMIN'), async (req, res) => {
  const { driver, monthlyFee, capacity, name } = req.body;
  if (driver) await Bus.updateMany({ _id: { $ne: req.params.id }, driver }, { driver: null });
  res.json(await Bus.findByIdAndUpdate(req.params.id, { driver: driver || null, monthlyFee, capacity, name }, { new: true }));
});

// REST fallback for drivers (primary path is the socket event)
router.post('/:id/location', allow('DRIVER'), async (req, res) => {
  const bus = await Bus.findOne({ _id: req.params.id, driver: req.user._id });
  if (!bus) return res.status(403).json({ message: 'Not your bus' });
  await applyLocation(req.app.get('io'), bus, { lat: +req.body.lat, lng: +req.body.lng, speed: Math.round(+req.body.speed || 0) }, true);
  res.json({ ok: true });
});
module.exports = router;
