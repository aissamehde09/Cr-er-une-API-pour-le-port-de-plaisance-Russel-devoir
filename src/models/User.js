/**
 * Ce fichier définit le modèle Mongoose User.
 * @module models/User
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @typedef {Object} User
 * @property {string} username
 * @property {string} email
 * @property {string} passwordHash
 */

/** @type {import('mongoose').Schema<User>} */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

/**
 * Ça compare un mot de passe brut avec le hash stocké.
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

/**
 * Ça hash un mot de passe pour stockage.
 * @param {string} password
 * @returns {Promise<string>}
 */
userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 10);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);

