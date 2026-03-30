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
      // For Serverless, we want a very small pool size (1) because scaling opens many instances.
      // This prevents hitting the 500 connection limit on MongoDB Free Tier.
      globalMongo.promise = mongoose.connect(MONGO_URI, {
        maxPoolSize: 1, 
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log('Attempting to connect to MongoDB...');
    }

    const connection = await globalMongo.promise;
    globalMongo.conn = connection.connection;
    console.log('Connected to MongoDB');
    return globalMongo.conn;
  } catch (err) {
    globalMongo.promise = null;
    console.error('MongoDB Connection Error:', err.message);
    if (err.name === 'MongooseServerSelectionError') {
      console.error('TIP: Check your Atlas IP allow-list or network connectivity.');
    }
    throw err;
  }
};

module.exports = connectDB;
