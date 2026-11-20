require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const User = require('./models/User');
const Bus = require('./models/Bus');
const { applyLocation } = require('./services/location');

const app = express();
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
app.use(helmet());
app.use(cors({ origin: origins }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/buses', require('./routes/buses'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Server error' }); });

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: origins } });
app.set('io', io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error('no token');
    const p = jwt.verify(token, process.env.JWT_SECRET || 'skardu_secret_jwt_key_shanelegance');
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

connectDB().then(() => {
  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log(`API running on :${port}`));
  if (process.env.SIMULATE_BUSES === 'true') require('./services/simulator')(io);
}).catch((e) => { console.error(e); process.exit(1); });
