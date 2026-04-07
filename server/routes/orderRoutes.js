import express from 'express';
import userAuth from '../middleware/userAuth.js';
import roleAuth from '../middleware/roleAuth.js';
import {
  createOrder,
  getOrders,
  getOrderById,
  assignOrder,
  submitQuote,
  respondToQuote,
  uploadPrepayment,
  uploadFinalPayment,
  markPartsOrdered,
  addTracking,
  markArrived,
  completeDelivery,
  verifyPrepayment,
  verifyFinalPayment,
  cancelOrder,
} from '../controllers/orderController.js';

const orderRouter = express.Router();

// Бүгд нэвтэрсэн байх шаардлагатай
orderRouter.use(userAuth);

// Захиалга үүсгэх / харах
orderRouter.post('/', roleAuth('customer'), createOrder);
orderRouter.get('/', getOrders);
orderRouter.get('/:id', getOrderById);

// АНУ ажилтны үйлдлүүд
orderRouter.post('/:id/assign', roleAuth('us_staff'), assignOrder);
orderRouter.post('/:id/quote', roleAuth('us_staff'), submitQuote);
orderRouter.post('/:id/parts-ordered', roleAuth('us_staff'), markPartsOrdered);
orderRouter.post('/:id/shipped', roleAuth('us_staff'), addTracking);

// Хэрэглэгчийн үйлдлүүд
orderRouter.post('/:id/quote-response', roleAuth('customer'), respondToQuote);
orderRouter.post('/:id/prepayment', roleAuth('customer'), uploadPrepayment);
orderRouter.post('/:id/final-payment', roleAuth('customer'), uploadFinalPayment);

// Монгол ажилтны үйлдлүүд
orderRouter.post('/:id/arrived', roleAuth('mn_staff'), markArrived);
orderRouter.post('/:id/deliver', roleAuth('mn_staff'), completeDelivery);

// Админы үйлдлүүд
orderRouter.post('/:id/verify-prepayment', roleAuth('admin'), verifyPrepayment);
orderRouter.post('/:id/verify-final-payment', roleAuth('admin'), verifyFinalPayment);

// Цуцлах (customer + admin)
orderRouter.post('/:id/cancel', roleAuth('customer', 'admin'), cancelOrder);

export default orderRouter;
