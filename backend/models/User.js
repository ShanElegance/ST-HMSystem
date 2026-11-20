const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['ADMIN', 'WARDEN', 'DRIVER', 'STUDENT'], required: true },
  phone: String,
  active: { type: Boolean, default: true },
  licenseNo: String,
  rollNo: String,
  className: String,
  guardianName: String,
  guardianPhone: String,
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
  pickupStop: String,
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
}, { timestamps: true });
userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.matches = function (p) {
  if (!p || !this.password) return false;
  return bcrypt.compare(p, this.password);
};
module.exports = mongoose.model('User', userSchema);
