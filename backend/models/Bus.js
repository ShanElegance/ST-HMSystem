const mongoose = require('mongoose');
const stop = new mongoose.Schema({ name: String, lat: Number, lng: Number, pickupTime: String }, { _id: false });
module.exports = mongoose.model('Bus', new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  name: String,
  capacity: { type: Number, default: 32 },
  monthlyFee: { type: Number, default: 4000 },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  routeName: String,
  stops: [stop],
  location: { lat: Number, lng: Number, speed: Number, updatedAt: Date, live: Boolean },
}, { timestamps: true }));
