const mongoose = require('mongoose');

const feedMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      index: 'text'
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    },
    reports: [
      {
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        reason: {
          type: String,
          required: true,
          trim: true
        },
        reportedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

feedMessageSchema.index({ createdAt: -1 });

const FeedMessage = mongoose.model('FeedMessage', feedMessageSchema);

module.exports = FeedMessage;
