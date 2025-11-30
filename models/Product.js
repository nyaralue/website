const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping 'id' for compatibility with existing frontend logic
    category: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    sku: { type: String },
    amazonLink: { type: String },
    flipkartLink: { type: String },
    meeshoLink: { type: String },
    sku: { type: String },
    amazonLink: { type: String },
    flipkartLink: { type: String },
    meeshoLink: { type: String },
    media: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
