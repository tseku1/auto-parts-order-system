import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

// Статус лог нэмэх helper
const addStatusHistory = (order, status, userId, note = '') => {
  order.statusHistory.push({ status, changedBy: userId, note });
};

// ─── Customer ─────────────────────────────────────────────────────────────────

// POST /api/orders  →  захиалга үүсгэх
export const createOrder = async (req, res) => {
  try {
    const { parts, vehicle, notes } = req.body;

    if (!parts || parts.length === 0) {
      return res.json({ success: false, message: 'Дор хаяж нэг эд анги оруулна уу' });
    }

    const order = new orderModel({
      customer: req.userId,
      parts,
      vehicle,
      notes,
    });

    addStatusHistory(order, 'submitted', req.userId, 'Захиалга үүсгэгдлээ');
    await order.save();

    res.json({ success: true, message: 'Захиалга амжилттай илгээгдлээ', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/orders  →  роль тус бүр өөр жагсаалт харна
export const getOrders = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    let query = {};

    if (user.role === 'customer') {
      query = { customer: req.userId };
    } else if (user.role === 'us_staff') {
      // Submitted (хэн ч авч амжаагүй) эсвэл өөртөө assign хийгдсэн
      query = { $or: [{ status: 'submitted' }, { assignedTo: req.userId }] };
    } else if (user.role === 'mn_staff') {
      query = { status: { $in: ['shipped', 'arrived', 'out_for_delivery', 'delivered', 'completed'] } };
    }
    // admin бол бүгдийг харна (query = {})

    const orders = await orderModel.find(query)
      .populate('customer', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id  →  захиалгын дэлгэрэнгүй
export const getOrderById = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('assignedTo', 'name email')
      .populate('delivery.mnStaff', 'name email')
      .populate('statusHistory.changedBy', 'name role');

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });

    // Customer зөвхөн өөрийнхийг харна
    const user = await userModel.findById(req.userId);
    if (user.role === 'customer' && order.customer._id.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Хандах эрхгүй' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── US Staff ─────────────────────────────────────────────────────────────────

// POST /api/orders/:id/assign  →  АНУ ажилтан захиалга авах
export const assignOrder = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });

    if (order.status !== 'submitted') {
      return res.json({ success: false, message: 'Энэ захиалга аль хэдийн авагдсан байна' });
    }

    order.assignedTo = req.userId;
    order.assignedAt = new Date();
    order.status = 'assigned';
    addStatusHistory(order, 'assigned', req.userId, 'Захиалга авч боловсруулж эхэллээ');

    await order.save();
    res.json({ success: true, message: 'Захиалга таньд хуваарилагдлаа', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/quote  →  АНУ ажилтан үнийн санал илгээх
export const submitQuote = async (req, res) => {
  try {
    const { parts, shippingCost, note } = req.body;
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });
    if (order.assignedTo?.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Энэ захиалгыг та хариуцахгүй байна' });
    }
    if (!['assigned', 'quote_rejected'].includes(order.status)) {
      return res.json({ success: false, message: 'Одоогийн статусд үнийн санал илгээх боломжгүй' });
    }

    const totalAmount = parts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0) + (shippingCost || 0);

    order.quote = { parts, shippingCost: shippingCost || 0, totalAmount, note, sentAt: new Date() };
    order.status = 'quote_sent';
    addStatusHistory(order, 'quote_sent', req.userId, `Нийт дүн: $${totalAmount}`);

    await order.save();
    res.json({ success: true, message: 'Үнийн санал илгээгдлээ', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/parts-ordered  →  АНУ-д эд анги худалдан авсан
export const markPartsOrdered = async (req, res) => {
  try {
    const { purchaseReceiptUrl } = req.body;
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });
    if (order.assignedTo?.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Энэ захиалгыг та хариуцахгүй байна' });
    }
    if (order.status !== 'prepayment_verified') {
      return res.json({ success: false, message: 'Урьдчилгаа төлбөр баталгаажаагүй байна' });
    }

    order.shipping = { ...order.shipping, purchaseReceiptUrl };
    order.status = 'parts_ordered';
    addStatusHistory(order, 'parts_ordered', req.userId, 'Эд анги худалдан авагдлаа');

    await order.save();
    res.json({ success: true, message: 'Эд анги худалдан авсан гэж тэмдэглэгдлээ', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/shipped  →  Карго руу өгсөн, tracking нэмэх
export const addTracking = async (req, res) => {
  try {
    const { trackingNumber, cargoCompany } = req.body;
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });
    if (order.assignedTo?.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Энэ захиалгыг та хариуцахгүй байна' });
    }
    if (order.status !== 'parts_ordered') {
      return res.json({ success: false, message: 'Эд анги захиалагдаагүй байна' });
    }
    if (!trackingNumber || !cargoCompany) {
      return res.json({ success: false, message: 'Tracking дугаар болон карго компани шаардлагатай' });
    }

    order.shipping = { ...order.shipping, trackingNumber, cargoCompany, shippedAt: new Date() };
    order.status = 'shipped';
    addStatusHistory(order, 'shipped', req.userId, `${cargoCompany} | ${trackingNumber}`);

    await order.save();
    res.json({ success: true, message: 'Тээвэрлэлтийн мэдээлэл нэмэгдлээ', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Customer ─────────────────────────────────────────────────────────────────

// POST /api/orders/:id/quote-response  →  Хэрэглэгч үнийн санал зөвшөөрөх/татгалзах
export const respondToQuote = async (req, res) => {
  try {
    const { approved, rejectionReason } = req.body;
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });
    if (order.customer.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Хандах эрхгүй' });
    }
    if (order.status !== 'quote_sent') {
      return res.json({ success: false, message: 'Үнийн санал ирээгүй байна' });
    }

    order.quoteResponse = { approved, respondedAt: new Date(), rejectionReason };
    order.status = approved ? 'quote_approved' : 'quote_rejected';
    addStatusHistory(order, order.status, req.userId, approved ? 'Зөвшөөрсөн' : `Татгалзсан: ${rejectionReason}`);

    await order.save();
    res.json({ success: true, message: approved ? 'Үнийн санал зөвшөөрөгдлөө' : 'Үнийн санал татгалзагдлаа', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/prepayment  →  Хэрэглэгч урьдчилгаа баримт upload хийх
export const uploadPrepayment = async (req, res) => {
  try {
    const { receiptUrl } = req.body;
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });
    if (order.customer.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Хандах эрхгүй' });
    }
    if (order.status !== 'quote_approved') {
      return res.json({ success: false, message: 'Үнийн санал зөвшөөрөгдөөгүй байна' });
    }
    if (!receiptUrl) {
      return res.json({ success: false, message: 'Баримтын URL шаардлагатай' });
    }

    const prepayAmount = order.quote.totalAmount * 0.7;
    order.prepayment = { amount: prepayAmount, receiptUrl, uploadedAt: new Date() };
    order.status = 'prepayment_uploaded';
    addStatusHistory(order, 'prepayment_uploaded', req.userId, `Урьдчилгаа: $${prepayAmount.toFixed(2)}`);

    await order.save();
    res.json({ success: true, message: 'Урьдчилгаа баримт хавсаргагдлаа', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/final-payment  →  Хэрэглэгч үлдсэн 30% баримт upload
export const uploadFinalPayment = async (req, res) => {
  try {
    const { receiptUrl } = req.body;
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });
    if (order.customer.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Хандах эрхгүй' });
    }
    if (order.status !== 'delivered') {
      return res.json({ success: false, message: 'Бараа хүлээн аваагүй байна' });
    }

    const finalAmount = order.quote.totalAmount * 0.3;
    order.finalPayment = { amount: finalAmount, receiptUrl, uploadedAt: new Date() };
    addStatusHistory(order, order.status, req.userId, `Үлдсэн төлбөр: $${finalAmount.toFixed(2)}`);

    await order.save();
    res.json({ success: true, message: 'Үлдсэн төлбөрийн баримт хавсаргагдлаа', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


// POST /api/orders/:id/arrived  →  Монголд ирсэн гэж тэмдэглэх
export const markArrived = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });
    if (order.status !== 'shipped') {
      return res.json({ success: false, message: 'Тээвэрлэлтийн статусд биш байна' });
    }

    order.delivery = { ...order.delivery, arrivedAt: new Date(), mnStaff: req.userId };
    order.status = 'arrived';
    addStatusHistory(order, 'arrived', req.userId, 'Карго Монголд ирлээ');

    await order.save();
    res.json({ success: true, message: 'Монголд ирсэн гэж тэмдэглэгдлээ', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/deliver  →  Хэрэглэгчид хүргэсэн
export const completeDelivery = async (req, res) => {
  try {
    const { recipientName } = req.body;
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });
    if (!['arrived', 'out_for_delivery'].includes(order.status)) {
      return res.json({ success: false, message: 'Барааг хүргэх боломжгүй статус байна' });
    }
    if (!recipientName) {
      return res.json({ success: false, message: 'Хүлээн авагчийн нэр шаардлагатай' });
    }

    order.delivery = {
      ...order.delivery,
      mnStaff: req.userId,
      recipientName,
      deliveredAt: new Date(),
    };
    order.status = 'delivered';
    addStatusHistory(order, 'delivered', req.userId, `Хүлээн авагч: ${recipientName}`);

    await order.save();
    res.json({ success: true, message: 'Хүргэлт дууслаа', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Admin ─────────────────────────────────────────────────────────────────────

// POST /api/orders/:id/verify-prepayment  →  Урьдчилгаа баталгаажуулах
export const verifyPrepayment = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });
    if (order.status !== 'prepayment_uploaded') {
      return res.json({ success: false, message: 'Урьдчилгаа баримт хавсаргагдаагүй байна' });
    }

    order.prepayment.verifiedAt = new Date();
    order.prepayment.verifiedBy = req.userId;
    order.status = 'prepayment_verified';
    addStatusHistory(order, 'prepayment_verified', req.userId, 'Урьдчилгаа баталгаажлаа');

    await order.save();
    res.json({ success: true, message: 'Урьдчилгаа баталгаажлаа', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/verify-final-payment  →  Үлдсэн төлбөр баталгаажуулах
export const verifyFinalPayment = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });
    if (!order.finalPayment?.receiptUrl) {
      return res.json({ success: false, message: 'Үлдсэн төлбөрийн баримт хавсаргагдаагүй байна' });
    }

    order.finalPayment.verifiedAt = new Date();
    order.finalPayment.verifiedBy = req.userId;
    order.status = 'completed';
    addStatusHistory(order, 'completed', req.userId, 'Захиалга бүрэн дууслаа');

    await order.save();
    res.json({ success: true, message: 'Захиалга дууслаа', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id  →  Захиалга засах (customer: submitted үед, admin: always)
export const updateOrder = async (req, res) => {
  try {
    const { parts, vehicle, notes } = req.body;
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });

    const user = await userModel.findById(req.userId);
    if (user.role === 'customer') {
      if (order.customer.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: 'Хандах эрхгүй' });
      }
      if (order.status !== 'submitted') {
        return res.json({ success: false, message: 'Зөвхөн "Илгээсэн" статустай захиалгыг засаж болно' });
      }
    }

    if (parts && parts.length > 0) order.parts = parts;
    if (vehicle) order.vehicle = vehicle;
    if (notes !== undefined) order.notes = notes;

    addStatusHistory(order, order.status, req.userId, 'Захиалга засагдлаа');
    await order.save();
    res.json({ success: true, message: 'Захиалга шинэчлэгдлээ', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// DELETE /api/orders/:id  →  Захиалга устгах (customer: submitted үед, admin: always)
export const deleteOrder = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });

    const user = await userModel.findById(req.userId);
    if (user.role === 'customer') {
      if (order.customer.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: 'Хандах эрхгүй' });
      }
      if (order.status !== 'submitted') {
        return res.json({ success: false, message: 'Зөвхөн "Илгээсэн" статустай захиалгыг устгаж болно' });
      }
    }

    await orderModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Захиалга устгагдлаа' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/cancel  →  Захиалга цуцлах
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await orderModel.findById(req.params.id);
    const user = await userModel.findById(req.userId);

    if (!order) return res.json({ success: false, message: 'Захиалга олдсонгүй' });

    const cancellableStatuses = ['submitted', 'assigned', 'quote_sent', 'quote_rejected'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.json({ success: false, message: 'Энэ статусд цуцлах боломжгүй' });
    }

    // Customer зөвхөн submitted үед цуцалж болно
    if (user.role === 'customer' && order.status !== 'submitted') {
      return res.status(403).json({ success: false, message: 'Та одоо цуцалж болохгүй' });
    }

    order.status = 'cancelled';
    addStatusHistory(order, 'cancelled', req.userId, reason || 'Цуцлагдлаа');

    await order.save();
    res.json({ success: true, message: 'Захиалга цуцлагдлаа', order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
