require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = (process.env.ADMIN_EMAIL || 'admin@shanelegance.pk').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe@123';
  if (await User.findOne({ email })) console.log('Admin already exists:', email);
  else {
    await User.create({ name: process.env.ADMIN_NAME || 'Shan Elegance', email, password, role: 'ADMIN', phone: '+92 355 0000000' });
    console.log('Admin created:', email);
  }
  process.exit(0);
})();
