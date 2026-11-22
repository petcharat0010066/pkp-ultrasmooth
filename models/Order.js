const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    quantity: Number,
    unitPrice: Number
  }],
  total: { type: Number, required: true },
  status: { type: String, default: 'กำลังเตรียมจัดส่ง' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
