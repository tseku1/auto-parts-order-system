import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },

  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },

  // Захиалсан эд ангиуд
  parts: [{
    partNumber: { type: String, required: true },
    description: String,
    quantity: { type: Number, default: 1 },
    imageUrl: String,
    notes: String,
  }],

  // Автомашины мэдээлэл
  vehicle: {
    make: String,    // марк
    model: String,   // загвар
    year: Number,    // он
    engine: String,  // хөдөлгүүр
  },

  notes: String,

  // АНУ ажилтанд хуваарилалт
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
  assignedAt: Date,

  // Үнийн санал (АНУ ажилтан бөглөнө)
  quote: {
    parts: [{
      partNumber: String,
      description: String,
      quantity: Number,
      unitPrice: Number,
    }],
    shippingCost: { type: Number, default: 0 },
    totalAmount: Number,
    note: String,
    sentAt: Date,
  },

  // Хэрэглэгчийн үнийн санал зөвшөөрсөн эсэх
  quoteResponse: {
    approved: Boolean,
    respondedAt: Date,
    rejectionReason: String,
  },

  // Урьдчилгаа төлбөр (70%)
  prepayment: {
    amount: Number,
    receiptUrl: String,
    uploadedAt: Date,
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  },

  // АНУ-д худалдан авалт + тээвэрлэлт
  shipping: {
    purchaseReceiptUrl: String,
    trackingNumber: String,
    cargoCompany: String,
    shippedAt: Date,
  },

  // Монгол дахь хүргэлт
  delivery: {
    mnStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    arrivedAt: Date,
    scheduledAt: Date,
    recipientName: String,
    deliveredAt: Date,
  },

  // Үлдсэн төлбөр (30%)
  finalPayment: {
    amount: Number,
    receiptUrl: String,
    uploadedAt: Date,
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  },

  status: {
    type: String,
    enum: [
      'submitted',           // Хэрэглэгч илгээсэн
      'assigned',            // АНУ ажилтанд хуваарилагдсан
      'quote_sent',          // Үнийн санал илгээсэн
      'quote_approved',      // Үнийн санал зөвшөөрсөн
      'quote_rejected',      // Үнийн санал татгалзсан
      'prepayment_uploaded', // Урьдчилгаа баримт хавсаргасан
      'prepayment_verified', // Урьдчилгаа баталгаажсан
      'parts_ordered',       // АНУ-д эд анги захиалагдсан
      'shipped',             // Карго руу өгсөн (tracking нэмэгдсэн)
      'arrived',             // Монголд ирсэн
      'out_for_delivery',    // Хүргэлтэнд гарсан
      'delivered',           // Хэрэглэгчид хүргэгдсэн
      'completed',           // Үлдсэн төлбөр баталгаажсан
      'cancelled',           // Цуцлагдсан
    ],
    default: 'submitted',
  },

  // Аудит лог
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    changedAt: { type: Date, default: Date.now },
    note: String,
  }],

}, { timestamps: true });

// Захиалгын дугаар автоматаар үүсгэх
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(10000 + Math.random() * 90000);
    this.orderNumber = `APO-${dateStr}-${random}`;
  }
  next();
});

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);

export default orderModel;
