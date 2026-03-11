const mongoose = require('mongoose');

const catwaySchema = new mongoose.Schema(
  {
    catwayNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1
    },
    catwayType: {
      type: String,
      required: true,
      enum: ['long', 'short']
    },
    catwayState: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    }
  },
  { timestamps: true }
);

catwaySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Catway', catwaySchema);
