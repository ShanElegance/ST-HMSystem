const mongoose = require('mongoose');
module.exports = mongoose.model('Room', new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  floor: Number,
  beds: { type: Number, required: true },
  rentPerBed: { type: Number, required: true },
  amenities: [String],
}, { timestamps: true }));
