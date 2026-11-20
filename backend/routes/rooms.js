const router = require('express').Router();
const Room = require('../models/Room');
const User = require('../models/User');
const { protect, allow } = require('../middleware/auth');
router.use(protect, allow('ADMIN', 'WARDEN'));

router.get('/', async (req, res) => {
  const rooms = await Room.find().sort({ number: 1 }).lean();
  const occ = await User.find({ room: { $ne: null } }).select('name rollNo className room');
  res.json(rooms.map((r) => ({ ...r, occupants: occ.filter((o) => String(o.room) === String(r._id)) })));
});
router.put('/:id', async (req, res) => {
  res.json(await Room.findByIdAndUpdate(req.params.id, { rentPerBed: req.body.rentPerBed }, { new: true }));
});
router.post('/:id/assign', async (req, res) => {
  const room = await Room.findById(req.params.id);
  const student = await User.findOne({ _id: req.body.studentId, role: 'STUDENT' });
  if (!room || !student) return res.status(404).json({ message: 'Not found' });
  const taken = await User.countDocuments({ room: room._id });
  if (taken >= room.beds) return res.status(400).json({ message: 'Room is full' });
  student.room = room._id;
  await student.save();
  res.json({ ok: true });
});
router.post('/unassign', async (req, res) => {
  await User.updateOne({ _id: req.body.studentId }, { room: null });
  res.json({ ok: true });
});
module.exports = router;
