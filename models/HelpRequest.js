const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
    productName: String,
    productSku: String,
    name: { type: String, required: true },
    email: { type: String, required: true },
    query: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
