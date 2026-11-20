const mongoose = require('mongoose');
module.exports = mongoose.model('Menu', new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  order: Number,
  breakfast: String,
  lunch: String,
  dinner: String,
}));
