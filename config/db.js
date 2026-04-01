// config/db.js
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizApp';

// Detect if running in serverless environment
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// Pool size: 1 for serverless (cold start optimization), higher for traditional servers
const poolSize = isServerless ? 1 : (parseInt(process.env.MONGO_POOL_SIZE, 10) || 5);

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
        maxPoolSize: poolSize,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });
      console.log(`Attempting to connect to MongoDB (pool size: ${poolSize})...`);
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
