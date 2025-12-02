const mongoose = require('mongoose');

const skuSchema = new mongoose.Schema({
    skuId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    isAssigned: {
        type: Boolean,
        default: false
    },
    assignedToProduct: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SKU', skuSchema);