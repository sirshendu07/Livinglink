const mongoose = require('mongoose');

const refreshSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      index: true
    },
    device: {
      type: String,
      default: 'Unknown Device'
    },
    ipAddress: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index automatically removes expired sessions
    },
    isRevoked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);

module.exports = RefreshSession;
