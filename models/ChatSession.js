const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    id: { type: Number, default: () => Date.now() },
    sender: { type: String, enum: ['customer', 'admin'], required: true },
    category: String,
    text: { type: String, required: true },
    timestamp: String,
    isRead: { type: Boolean, default: false }
});

const chatSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, default: 'Website Visitor' },
    customerContact: { type: String, default: 'Not provided' },
    pageUrl: { type: String, default: 'Home' },
    lastActiveTime: { type: Number, default: () => Date.now() },
    messages: [chatMessageSchema]
}, { timestamps: true });

// Auto-delete / expire session from MongoDB 1 hour (3600 seconds) after last activity
chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
