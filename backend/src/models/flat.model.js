const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema(
  {
    tower: {
      type: String,
      required: [true, 'Tower identifier is required'],
      trim: true,
      uppercase: true,
      index: true
    },
    flatNumber: {
      type: String,
      required: [true, 'Flat number is required'],
      trim: true,
      uppercase: true,
      index: true
    },
    floor: {
      type: Number,
      min: 0
    },
    residents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound unique index so each flat in a tower is unique
flatSchema.index({ tower: 1, flatNumber: 1 }, { unique: true });

const Flat = mongoose.model('Flat', flatSchema);

module.exports = Flat;
