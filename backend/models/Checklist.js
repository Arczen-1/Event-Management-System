const mongoose = require('mongoose');

// ✅ DEFINE the sub-schema FIRST
const checklistItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  category: String,
  checked: Boolean,
  missing: Boolean,
  department: String
});

// ✅ THEN use it in the main schema
const checklistSchema = new mongoose.Schema({
  contractId: {
    type: String,
    required: true
  },
  contractNumber: {
    type: String,
    required: true
  },
  checklistItems: [checklistItemSchema], // Now this will work
  missingItems: [checklistItemSchema], // And this too
  submittedBy: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['creative', 'linen', 'warehouse'],
    default: 'creative'
  },
  submittedAt: Date,
  status: {
    type: String,
    default: 'submitted'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Checklist', checklistSchema);