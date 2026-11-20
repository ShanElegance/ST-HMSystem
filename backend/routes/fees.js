const router = require('express').Router();
const Fee = require('../models/Fee');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Room = require('../models/Room');
const cfg = require('../config/fees');
const { protect, allow } = require('../middleware/auth');
router.use(protect);

router.get('/structure', async (req, res) => {
  const [rooms, buses] = await Promise.all([Room.find().lean(), Bus.find().lean()]);
  const rents = [...new Set(rooms.map((r) => `${r.beds}|${r.rentPerBed}`))].map((s) => s.split('|').map(Number)).sort((a, b) => a[0] - b[0]);
  res.json({
    mess: cfg.MESS_FEE, heating: cfg.HEATING_FEE, heatingMonths: cfg.HEATING_MONTHS,
    hostel: rents.map(([beds, rent]) => ({ beds, rent })),
    transport: buses.map((b) => ({ route: b.routeName, fee: b.monthlyFee })),
  });
});

router.get('/', async (req, res) => {
  const q = {};
  if (req.user.role === 'STUDENT') q.student = req.user._id;
  else if (!['ADMIN', 'WARDEN'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  const { month, status } = req.query;
  if (month) q.month = month;
  if (status) q.status = status;
  res.json(await Fee.find(q).populate('student', 'name rollNo className guardianName').sort({ month: -1, createdAt: -1 }).limit(500));
});

router.post('/generate', allow('ADMIN', 'WARDEN'), async (req, res) => {
  const { month } = req.body;
  if (!/^\d{4}-\d{2}$/.test(month || '')) return res.status(400).json({ message: 'Invalid month' });
  const m = Number(month.slice(5));
  const students = await User.find({ role: 'STUDENT', active: true }).populate('room').populate('bus');
  const ops = [];
  for (const s of students) {
    if (s.room) {
      ops.push({ student: s._id, month, type: 'HOSTEL', amount: s.room.rentPerBed });
      ops.push({ student: s._id, month, type: 'MESS', amount: cfg.MESS_FEE });
      if (cfg.HEATING_MONTHS.includes(m)) ops.push({ student: s._id, month, type: 'HEATING', amount: cfg.HEATING_FEE });
    }
    if (s.bus) ops.push({ student: s._id, month, type: 'TRANSPORT', amount: s.bus.monthlyFee });
  }
  let created = 0;
  for (const o of ops) {
    const r = await Fee.updateOne({ student: o.student, month: o.month, type: o.type }, { $setOnInsert: o }, { upsert: true });
    if (r.upsertedCount) created++;
  }
  res.json({ created });
});

router.put('/:id/pay', allow('ADMIN', 'WARDEN'), async (req, res) => {
  res.json(await Fee.findByIdAndUpdate(req.params.id, { status: 'PAID', paidOn: new Date(), method: req.body.method || 'Cash' }, { new: true }));
});
module.exports = router;
