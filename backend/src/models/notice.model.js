const mongoose = require('mongoose');
const { NOTICE_CATEGORY, NOTICE_CATEGORY_LIST } = require('../constants/statuses');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      maxlength: 200,
      index: 'text'
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
      trim: true
    },
    category: {
      type: String,
      enum: NOTICE_CATEGORY_LIST,
      default: NOTICE_CATEGORY.GENERAL,
      index: true
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    },
    publishedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String, default: 'attachment' }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

noticeSchema.index({ isPublished: 1, isPinned: -1, publishedAt: -1 });

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
