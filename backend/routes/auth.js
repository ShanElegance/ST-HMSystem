const router = require('express').Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const populate = (q) => q
  .populate({ path: 'bus', populate: { path: 'driver', select: 'name phone' } })
  .populate('room');

router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!user || !user.active || !(await user.matches(password || '')))
    return res.status(401).json({ message: 'Invalid email or password' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'skardu_secret_jwt_key_shanelegance', { expiresIn: '7d' });
  res.json({ token, user: await populate(User.findById(user._id)) });
});

// Student Self-Registration (Strictly for STUDENT role)
router.post('/register', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), async (req, res) => {
  try {
    const { name, email, password, phone, rollNo, className, guardianName, guardianPhone, pickupStop } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!email || !email.trim()) return res.status(400).json({ message: 'Email is required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'An account with this email already exists' });

    // Determine or generate unique student roll number
    let assignedRoll = (rollNo || '').trim();
    if (!assignedRoll) {
      const studentCount = await User.countDocuments({ role: 'STUDENT' });
      assignedRoll = `SE-${String(studentCount + 1).padStart(3, '0')}`;
    } else {
      const rollExists = await User.findOne({ role: 'STUDENT', rollNo: assignedRoll });
      if (rollExists) {
        const studentCount = await User.countDocuments({ role: 'STUDENT' });
        assignedRoll = `SE-${String(studentCount + 1).padStart(3, '0')}`;
      }
    }

    // SECURITY POLICY: Role is hardcoded to STUDENT.
    // Staff roles (Admin, Warden, Driver) cannot be created through public registration.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'STUDENT',
      phone: (phone || '').trim(),
      rollNo: assignedRoll,
      className: (className || '6th').trim(),
      guardianName: (guardianName || '').trim(),
      guardianPhone: (guardianPhone || '').trim(),
      pickupStop: (pickupStop || '').trim(),
      bus: null,
      room: null,
      active: true,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'skardu_secret_jwt_key_shanelegance', { expiresIn: '7d' });
    const populatedUser = await populate(User.findById(user._id));

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: populatedUser,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ message: err.message || 'Registration failed' });
  }
});
router.get('/me', protect, async (req, res) => res.json(await populate(User.findById(req.user._id))));
module.exports = router;
