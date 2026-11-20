// Demo data for a Skardu school: 1 admin, 1 warden, 3 drivers, 3 buses, 30 hostel rooms, mess menu, students.
// NOTE: stop coordinates are approximate – verify on Google Maps and adjust for your real routes.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Room = require('../models/Room');
const Fee = require('../models/Fee');
const Menu = require('../models/Menu');
const { SCHOOL } = require('../config/fees');

const PASS = process.env.DEMO_PASSWORD || 'Skardu@123';
const school = (t) => ({ name: SCHOOL.name, lat: SCHOOL.lat, lng: SCHOOL.lng, pickupTime: t });

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([Bus.deleteMany(), Room.deleteMany(), Fee.deleteMany(), Menu.deleteMany(), User.deleteMany({ role: { $ne: 'ADMIN' } })]);

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@shanelegance.pk').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || 'ChangeMe@123';
  if (!(await User.findOne({ email: adminEmail })))
    await User.create({ name: process.env.ADMIN_NAME || 'Shan Elegance', email: adminEmail, password: adminPass, role: 'ADMIN', phone: '+92 355 0000000' });

  if (adminEmail !== 'admin@shanelegance.pk' && !(await User.findOne({ email: 'admin@shanelegance.pk' })))
    await User.create({ name: 'Admin Demo', email: 'admin@shanelegance.pk', password: 'ChangeMe@123', role: 'ADMIN', phone: '+92 355 0000000' });

  await User.create({ name: 'Muhammad Ibrahim', email: 'warden@shanelegance.pk', password: PASS, role: 'WARDEN', phone: '+92 355 1200101' });
  const drivers = await User.create([
    { name: 'Ghulam Abbas', email: 'driver1@shanelegance.pk', password: PASS, role: 'DRIVER', phone: '+92 355 1200201', licenseNo: 'GB-DL-4410' },
    { name: 'Muhammad Hussain', email: 'driver2@shanelegance.pk', password: PASS, role: 'DRIVER', phone: '+92 355 1200202', licenseNo: 'GB-DL-5127' },
    { name: 'Ali Raza', email: 'driver3@shanelegance.pk', password: PASS, role: 'DRIVER', phone: '+92 355 1200203', licenseNo: 'GB-DL-6093' },
  ]);

  const buses = await Bus.create([
    { number: 'GB-2101', name: 'Bus 1 – Satpara Road', capacity: 32, monthlyFee: 4500, driver: drivers[0]._id, routeName: 'Satpara – Kharpocho – School',
      stops: [{ name: 'Satpara Village', lat: 35.254, lng: 75.67, pickupTime: '07:05' }, { name: 'Satpara Road Chowk', lat: 35.279, lng: 75.656, pickupTime: '07:20' }, { name: 'Kharpocho Fort Road', lat: 35.2878, lng: 75.635, pickupTime: '07:32' }, school('07:45')] },
    { number: 'GB-2102', name: 'Bus 2 – Gamba & Hussainabad', capacity: 32, monthlyFee: 3500, driver: drivers[1]._id, routeName: 'Gamba – Hussainabad – Yadgar Chowk – School',
      stops: [{ name: 'Gamba', lat: 35.313, lng: 75.59, pickupTime: '07:00' }, { name: 'Hussainabad', lat: 35.305, lng: 75.602, pickupTime: '07:15' }, { name: 'Yadgar Chowk', lat: 35.2975, lng: 75.6335, pickupTime: '07:30' }, school('07:45')] },
    { number: 'GB-2103', name: 'Bus 3 – Airport Road', capacity: 30, monthlyFee: 5000, driver: drivers[2]._id, routeName: 'Airport Road – Kachura Road – Bazaar – School',
      stops: [{ name: 'Skardu Airport Road', lat: 35.3355, lng: 75.536, pickupTime: '06:50' }, { name: 'Kachura Road Chowk', lat: 35.315, lng: 75.57, pickupTime: '07:10' }, { name: 'Skardu Main Bazaar', lat: 35.2971, lng: 75.6345, pickupTime: '07:30' }, school('07:45')] },
  ]);

  // 30 rooms: 3 floors x 10
  const bedPattern = [2, 3, 4, 2, 3, 4, 2, 3, 4, 3];
  const rent = { 2: 14000, 3: 12000, 4: 10000 };
  const rooms = [];
  for (let f = 1; f <= 3; f++) for (let i = 1; i <= 10; i++) {
    const beds = bedPattern[i - 1];
    rooms.push({ number: String(f * 100 + i), floor: f, beds, rentPerBed: rent[beds],
      amenities: ['Bukhari / gas heater', 'Study desk', 'Warm blankets', ...(f >= 2 ? ['Attached bath'] : [])] });
  }
  const createdRooms = await Room.create(rooms);

  await Menu.create([
    { day: 'Monday', order: 1, breakfast: 'Khambir (Balti bread) with butter, apricot jam & Namkeen chai', lunch: 'Daal chawal, mixed sabzi, salad', dinner: 'Chicken karahi, roti, kheer' },
    { day: 'Tuesday', order: 2, breakfast: 'Paratha, omelette, doodh patti chai', lunch: 'Aloo gosht, roti, raita', dinner: 'Prapu (Balti stew) with khambir' },
    { day: 'Wednesday', order: 3, breakfast: 'Halwa puri, chana, chai', lunch: 'Rajma chawal, salad', dinner: 'Daal mash, sabzi, roti' },
    { day: 'Thursday', order: 4, breakfast: 'Khambir, boiled eggs, butter tea (Gur-gur cha)', lunch: 'Chicken pulao, raita', dinner: 'Qeema matar, roti, custard' },
    { day: 'Friday', order: 5, breakfast: 'Paratha, achar, chai', lunch: 'Mamtu (Balti steamed dumplings) with chutney', dinner: 'Beef biryani, raita, sweet dish' },
    { day: 'Saturday', order: 6, breakfast: 'Apricot (Halman) & walnut oats, milk', lunch: 'Daal chana, roti, salad', dinner: 'Chapli kebab, roti, kehwa' },
    { day: 'Sunday', order: 7, breakfast: 'Anda paratha, lassi', lunch: 'Mutton shorba, roti', dinner: 'Chicken handi, naan, ice cream' },
  ]);

  const names = ['Muhammad Abbas', 'Ali Haider', 'Hassan Raza', 'Zainab Fatima', 'Kazim Hussain', 'Sakina Bano', 'Mehdi Abbas', 'Yasir Ali', 'Nusrat Jahan', 'Haider Ali', 'Ayesha Batool', 'Ibrahim Khan',
    'Mariam Zehra', 'Imran Hussain', 'Fatima Batool', 'Wajahat Ali', 'Sadia Parveen', 'Shabbir Hussain', 'Rubab Fatima', 'Jaffar Ali', 'Anwar Hussain', 'Sana Zehra', 'Akbar Ali', 'Tahira Bano'];
  const classes = ['6th', '7th', '8th', '9th', '10th', '11th (FSc)', '12th (FSc)'];
  const used = {};
  const students = names.map((n, i) => {
    const roll = `SE-${String(i + 1).padStart(3, '0')}`;
    const s = { name: n, email: `${roll.toLowerCase()}@student.shanelegance.pk`, password: PASS, role: 'STUDENT', rollNo: roll,
      className: classes[i % classes.length], guardianName: `Haji ${n.split(' ').pop()} Sahib`, guardianPhone: `+92 355 ${1300000 + i * 37}` };
    if (i < 14) { // hostel residents, two per room to start
      const r = createdRooms.find((r) => (used[r._id] || 0) < 2);
      used[r._id] = (used[r._id] || 0) + 1;
      s.room = r._id;
    }
    if (i >= 8) { // bus riders
      const b = buses[i % 3];
      s.bus = b._id; s.pickupStop = b.stops[i % (b.stops.length - 1)].name;
    }
    return s;
  });
  await User.create(students);

  console.log('Demo data ready.');
  console.log('Admin :', adminEmail, '/', process.env.ADMIN_PASSWORD);
  console.log('Others: warden@, driver1-3@ shanelegance.pk, se-001@student.shanelegance.pk /', PASS);
  process.exit(0);
})();
