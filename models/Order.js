const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  productId: { type: String },
  productName: { type: String, required: true },
  productSku: { type: String, required: true, trim: true },
  quantity: { type: Number, default: 1 },
  amount: { type: Number, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  deliveryAddress: { type: String, required: true },
  pincode: { type: String, required: true },
  locationLink: { type: String, default: '' },
  paymentId: { type: String, default: '' },
  paymentStatus: { type: String, default: 'PAID' },
  platform: { type: String, default: 'website' },
  orderType: { type: String, default: 'sale' }, // 'sale' or 'return'
  orderDate: { type: String },
  returnDate: { type: String, default: '' },
  returnReason: { type: String, default: '' },
  returnReceivedDate: { type: String, default: '' },
  inventoryReceived: { type: String, default: 'yes' },
  imageUrl: { type: String, default: '' },
  remark: { type: String, default: 'automated' },
  sheetSyncStatus: { type: String, default: 'PENDING' },
  shippingLabelUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
