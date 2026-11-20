const jwt = require('jsonwebtoken');
const User = require('../models/User');
exports.protect = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    const p = jwt.verify(t, process.env.JWT_SECRET || 'skardu_secret_jwt_key_shanelegance');
    const u = await User.findById(p.id);
    if (!u || !u.active) return res.status(401).json({ message: 'Unauthorized' });
    req.user = u;
    next();
  } catch { res.status(401).json({ message: 'Unauthorized' }); }
};
exports.allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Access denied' });
