// config/db.js
const mongoose = require('mongoose');

// In a real app, this should be an environment variable
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizApp';
const globalMongo = global.__vanshMongo || {
  conn: null,
  promise: null,
};

global.__vanshMongo = globalMongo;

const connectDB = async () => {
  if (globalMongo.conn) {
    return globalMongo.conn;
  }

  try {
    if (!globalMongo.promise) {
      globalMongo.promise = mongoose.connect(MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
    }

    const connection = await globalMongo.promise;
    globalMongo.conn = connection.connection;
    console.log('Connected to MongoDB');
    return globalMongo.conn;
  } catch (err) {
    globalMongo.promise = null;
    console.error('MongoDB Connection Error:', err.message);
    throw err;
  }
};

module.exports = connectDB;
