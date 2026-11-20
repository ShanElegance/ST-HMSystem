const mongoose = require('mongoose');
const s = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true },
  type: { type: String, enum: ['HOSTEL', 'MESS', 'TRANSPORT', 'HEATING'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PAID', 'UNPAID'], default: 'UNPAID' },
  paidOn: Date,
  method: String,
}, { timestamps: true });
s.index({ student: 1, month: 1, type: 1 }, { unique: true });
module.exports = mongoose.model('Fee', s);
