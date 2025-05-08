import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true }
});

const droneSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  model: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  type: { type: String, enum: ['venta', 'alquiler'], required: true },
  condition: { type: String, enum: ['nuevo', 'usado'], required: true },
  location: { type: String, required: true },
  contact: { type: String, required: true },
  category: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  ratings: [ratingSchema]
});

export interface IRating {
  userId: string;
  rating: number;
  comment: string;
}

export interface IDrone {
  id: string;
  name: string;
  model: string;
  price: number;
  description: string;
  images: string[];
  type: 'venta' | 'alquiler';
  condition: 'nuevo' | 'usado';
  location: string;
  contact: string;
  category: string;
  sellerId: string;
  createdAt?: Date;
  ratings: IRating[];
}

// Mensajes
const messageSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  content:    { type: String, required: true },
}, {
  timestamps: true    
});

// Pedidos
const orderSchema = new mongoose.Schema({
  droneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drone', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:  { type: String, enum: ['pendiente', 'enviado', 'entregado'], default: 'pendiente' },
  createdAt:{ type: Date, default: Date.now }
});

// Pagos
const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:  { type: Number, required: true },
  status:  { type: String, enum: ['pendiente', 'completado', 'fallido'], default: 'pendiente' },
  createdAt:{ type: Date, default: Date.now }
});

// Evitar OverwriteModelError comprobando si ya existen
const Drone = mongoose.models.Drone || mongoose.model('Drone', droneSchema);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
const Order   = mongoose.models.Order   || mongoose.model('Order', orderSchema);
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Drone;
export { Drone, Message, Order, Payment };