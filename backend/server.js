require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const User = require('./models/User');
const Bus = require('./models/Bus');
const { applyLocation } = require('./services/location');

const IS_VERCEL = !!process.env.VERCEL;

const app = express();
const origins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: origins }));
app.use(express.json());
if (!IS_VERCEL) app.use(morgan('dev'));

// No-op io so routes/services that call io.to(...).emit(...) don't crash without sockets
const noopIo = { to: () => noopIo, in: () => noopIo, emit: () => {} };
app.set('io', noopIo);

// Reuse one DB connection across warm serverless invocations
let dbPromise;
const ensureDB = () => {
  if (!dbPromise) dbPromise = connectDB().catch((e) => { dbPromise = null; throw e; });
  return dbPromise;
};

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use(async (req, res, next) => {
  try { await ensureDB(); next(); } catch (e) { next(e); }
});

// ---- Auth helper for the location endpoints (replaces socket auth on Vercel) ----
const requireAuth = async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const p = jwt.verify(token, process.env.JWT_SECRET);
    const u = await User.findById(p.id);
    if (!u || !u.active) return res.status(401).json({ message: 'Unauthorized' });
    req.user = u;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Driver posts location (replaces the socket 'bus:location' event)
app.post('/api/location/update', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'DRIVER') return res.status(403).json({ message: 'Forbidden' });
    const { lat, lng, speed } = req.body;
    if (!Number.isFinite(+lat) || !Number.isFinite(+lng)) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }
    const bus = await Bus.findOne({ driver: req.user._id });
    if (!bus) return res.status(404).json({ message: 'No bus assigned' });
    await applyLocation(req.app.get('io'), bus, { lat: +lat, lng: +lng, speed: Math.round(+speed || 0) }, true);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Map polls this (replaces socket updates for ADMIN/WARDEN/STUDENT)
app.get('/api/location/buses', requireAuth, async (req, res, next) => {
  try {
    const { role, bus, _id } = req.user;
    let filter = null;
    if (['ADMIN', 'WARDEN'].includes(role)) filter = {};
    else if (role === 'STUDENT' && bus) filter = { _id: bus };
    else if (role === 'DRIVER') filter = { driver: _id };
    if (!filter) return res.json([]);
    res.json(await Bus.find(filter).lean());
  } catch (e) { next(e); }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/buses', require('./routes/buses'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Server error' }); });

// ---- Local development only: HTTP server + Socket.io + simulator ----
if (!IS_VERCEL) {
  const http = require('http');
  const { Server } = require('socket.io');

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: origins } });
  app.set('io', io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error('no token');
      const p = jwt.verify(token, process.env.JWT_SECRET);
      const u = await User.findById(p.id);
      if (!u || !u.active) throw new Error();
      socket.user = u;
      next();
    } catch { next(new Error('unauthorized')); }
  });

  io.on('connection', async (socket) => {
    const u = socket.user;
    if (['ADMIN', 'WARDEN'].includes(u.role)) socket.join('staff');
    if (u.role === 'STUDENT' && u.bus) socket.join(`bus:${u.bus}`);
    if (u.role === 'DRIVER') {
      const bus = await Bus.findOne({ driver: u._id });
      if (bus) socket.join(`bus:${bus._id}`);
    }
    socket.on('bus:location', async (d) => {
      if (u.role !== 'DRIVER') return;
      const bus = await Bus.findOne({ driver: u._id });
      if (bus) await applyLocation(io, bus, { lat: +d.lat, lng: +d.lng, speed: Math.round(+d.speed || 0) }, true);
    });
  });

  ensureDB().then(() => {
    const port = process.env.PORT || 5000;
    server.listen(port, () => console.log(`API running on :${port}`));
    if (process.env.SIMULATE_BUSES === 'true') require('./services/simulator')(io);
  }).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = app;