const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      enum: ['PER_DAY', 'PER_WEEK', 'PER_MONTH', 'THREE_MONTHS']
    },
    name: {
      type: String,
      required: true
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1
    },
    priceInPaise: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { _id: true }
);

const amenitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Amenity name is required'],
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    rules: [
      {
        type: String,
        trim: true
      }
    ],
    openingTime: {
      type: String,
      default: '06:00'
    },
    closingTime: {
      type: String,
      default: '22:00'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    plans: [subscriptionPlanSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Amenity = mongoose.model('Amenity', amenitySchema);

module.exports = Amenity;
