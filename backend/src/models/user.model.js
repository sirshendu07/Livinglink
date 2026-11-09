const mongoose = require('mongoose');
const { ROLES } = require('../constants/roles');
const { USER_STATUS } = require('../constants/statuses');
const { comparePassword } = require('../utils/crypto.utils');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false // Excluded by default from queries
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.OWNER,
      index: true
    },
    // Only OWNER has flat reference. ADMIN and SECURITY must be null.
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null,
      index: true,
      validate: {
        validator(val) {
          // If role is OWNER, flat is required. If ADMIN/SECURITY, flat must be null.
          if (this.role === ROLES.OWNER) {
            return val !== null && val !== undefined;
          }
          return val === null || val === undefined;
        },
        message: 'Flat assignment is only valid and required for OWNER accounts'
      }
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING_APPROVAL,
      index: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    avatarUrl: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return comparePassword(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
