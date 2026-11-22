const mongoose = require('mongoose');

// Reuse the connection across invocations (important on Vercel/serverless)
let cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

module.exports = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 5,
      })
      .then((m) => {
        console.log('MongoDB connected');
        return m;
      })
      .catch((err) => {
        cached.promise = null; // allow retry on the next request
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};