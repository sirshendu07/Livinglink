const mongoose = require('mongoose');

const noticeReadSchema = new mongoose.Schema(
  {
    notice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notice',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

noticeReadSchema.index({ notice: 1, user: 1 }, { unique: true });

const NoticeRead = mongoose.model('NoticeRead', noticeReadSchema);

module.exports = NoticeRead;
