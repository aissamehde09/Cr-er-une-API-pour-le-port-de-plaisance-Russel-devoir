const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI_STANDARD = process.env.MONGO_URI_STANDARD;

async function connectDb() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  mongoose.set('strictQuery', true);

  if (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost')) {
    console.warn('MongoDB URI points to local instance');
  } else if (MONGO_URI.startsWith('mongodb+srv://')) {
    console.log('MongoDB URI appears to be Atlas (mongodb+srv)');
  }

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  const connectWith = async (uri) => {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');
  };

  const isSrvError = (err) =>
    err &&
    typeof err.message === 'string' &&
    (err.message.includes('querySrv') ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('ENOTFOUND'));

  try {
    await connectWith(MONGO_URI);
  } catch (err) {
    if (MONGO_URI_STANDARD && isSrvError(err)) {
      console.warn('SRV lookup failed, retrying with standard MongoDB URI');
      try {
        await connectWith(MONGO_URI_STANDARD);
        return;
      } catch (fallbackErr) {
        console.error('MongoDB connection error (standard URI):', fallbackErr.message);
        process.exit(1);
      }
    }

    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDb;
