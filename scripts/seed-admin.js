/**
 * Petit script pour initialiser l'admin.
 * @module scripts/seed-admin
 */

require('dotenv').config();

const connectDb = require('../src/config/db');
const User = require('../src/models/User');

/**
 * Ça crée le compte admin s'il n'existe pas.
 * @returns {Promise<void>}
 */
async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    throw new Error('ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required');
  }

  await connectDb();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log('Admin user already exists');
    process.exit(0);
  }

  const passwordHash = await User.hashPassword(password);
  await User.create({
    username,
    email: email.toLowerCase(),
    passwordHash
  });

  console.log('Admin user created');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

