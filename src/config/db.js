/**
 * Ce fichier aide pour la connexion MongoDB.
 * @module config/db
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI_STANDARD = process.env.MONGO_URI_STANDARD;

/**
 * Ça sert à se connecter à MongoDB Atlas via les variables d'environnement.
 * @returns {Promise<void>}
 */
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

  /**
   * Ça sert à se connecter avec une URI spécifique.
   * @param {string} uri
   * @returns {Promise<void>}
   */
  const connectWith = async (uri) => {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');
  };

  /**
   * Ça détecte les erreurs de résolution SRV/DNS.
   * @param {Error} err
   * @returns {boolean}
   */
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


