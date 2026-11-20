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
router.get('/me', protect, async (req, res) => res.json(await populate(User.findById(req.user._id))));
module.exports = router;
