import Drone, { IDrone } from '../models/drone_models.js';
import User               from '../models/user_models.js';
import mongoose           from 'mongoose';
import { getExchangeRate } from '../utils/exchangeRates.js';

/* ---------- Helpers ---------- */
const validateUserNotDeleted = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new Error('Usuario no encontrado o eliminado');
};

const buildQuery = (filters: any = {}) => {
  const q: any = {};
  if (filters.category)  q.category  = filters.category;
  if (filters.condition) q.condition = filters.condition;
  if (filters.location)  q.location  = { $regex: filters.location, $options: 'i' };

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    q.price = {};
    if (filters.priceMin !== undefined) q.price.$gte = filters.priceMin;
    if (filters.priceMax !== undefined) q.price.$lte = filters.priceMax;
  }

  if (filters.q) {
    q.$or = [
      { model:   { $regex: filters.q, $options: 'i' } },
      { details: { $regex: filters.q, $options: 'i' } }
    ];
  }

  return q;
};


/* ---------- CRUD principal ---------- */

// Crear un dron per venda / servei
export const createDrone = async (droneData: IDrone) => {
  await validateUserNotDeleted(droneData.ownerId);
  if (!droneData.location) throw new Error('La ubicació és obligatòria');
  const drone = new Drone(droneData);
  await drone.save();
  return drone;
};

// Llistar drons amb paginació i filtres
export const getDrones = async (
  page = 1,
  limit = 10,
  filters: Record<string, any> = {}
) => {
  const skip = (page - 1) * limit;
  const query = buildQuery(filters);
  return await Drone.find(query).skip(skip).limit(limit);
};

// Dron per ID
export const getDroneById    = async (id: string) =>  await Drone.findById(id);
export const getOwnerByDroneId = async (id: string) =>
  await Drone.findById(id).populate('ownerId', 'name email');

// Update / delete
export const updateDrone   = async (id: string, data: Partial<IDrone>) =>
  await Drone.findByIdAndUpdate(id, data, { new: true });
export const deleteDrone   = async (id: string) => await Drone.findByIdAndDelete(id);

/* ---------- Llistes curtes ---------- */
export const getDronesByCategory   = async (category: string) =>
  await Drone.find({ category });

export const getDronesByPriceRange = async (min: number, max: number) =>
  await Drone.find({ price: { $gte: min, $lte: max } });

/* ---------- Reviews ---------- */
export const addReviewToDrone = async (
  droneId: string, userId: string, rating: number, comment: string
) => {
  const drone = await Drone.findById(droneId);
  if (!drone) return null;
  await validateUserNotDeleted(userId);

  drone.ratings.push({ userId, rating, comment });
  await drone.save();
  return drone;
};

/* ---------- Favorits ---------- */
export const addFavorite = async (userId: string, droneId: string) => {
  await validateUserNotDeleted(userId);
  const user = await User.findById(userId);
  if (!user!.favorites!.some(id => id.toString() === droneId)) {
    user!.favorites!.push(new mongoose.Types.ObjectId(droneId));
    await user!.save();
  }
  return user!.favorites;
};

export const removeFavorite = async (userId: string, droneId: string) => {
  await validateUserNotDeleted(userId);
  const user = await User.findById(userId);
  user!.favorites = user!.favorites!.filter(id => id.toString() !== droneId);
  await user!.save();
  return user!.favorites;
};

export const getFavorites = async (userId: string, page = 1, limit = 10) => {
  await validateUserNotDeleted(userId);
  const skip = (page - 1) * limit;
  const user = await User.findById(userId).populate({
    path: 'favorites',
    options: { skip, limit }
  });
  return user?.favorites || [];
};

/* --- MARCAR VENUT --- */
export const markDroneSold = async (droneId: string) =>
    await Drone.findByIdAndUpdate(droneId, { status: 'venut' }, { new: true });
  
  /* --- Llistar anuncis propis --- */
  export const getMyDrones = async (ownerId: string, status?: 'pending' | 'sold') => {
    const query: any = { ownerId };
    if (status === 'pending') query.status = 'actiu';
    if (status === 'sold')    query.status = 'venut';
    return await Drone.find(query).sort({ createdAt: -1 });
  };

export const purchaseDroneWithBalance = async (droneId: string, userId: string, payWithCurrency?: string) => {
  const drone = await Drone.findById(droneId);
  if (!drone) throw new Error('Dron no encontrado');
  if (drone.status === 'venut') throw new Error('Dron ya vendido');
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');
  if (!user.balance) user.balance = new Map();

  // Solo permitir pagar en la divisa indicada
  if (!payWithCurrency) throw new Error('Debes indicar la divisa con la que quieres pagar (payWithCurrency)');
  if (!user.balance.has(payWithCurrency)) throw new Error('No tienes saldo en la divisa seleccionada');

  // Calcular el precio en la divisa seleccionada
  let price = drone.price;
  if (drone.currency !== payWithCurrency) {
    const rate = await getExchangeRate(drone.currency, payWithCurrency);
    price = Math.round((drone.price / rate) * 100) / 100;
  }
  const userBalance = user.balance.get(payWithCurrency) || 0;
  if (userBalance < price) throw new Error('Saldo insuficiente en la divisa seleccionada');

  // Descontar saldo
  user.balance.set(payWithCurrency, userBalance - price);
  await user.save();
  drone.status = 'venut';
  drone.buyerId = new mongoose.Types.ObjectId(userId);
  await drone.save();
  return { drone, user: { ...user.toObject(), balance: Object.fromEntries(user.balance) } };
};

// Devuelve el dron con el precio convertido a la divisa solicitada
export const getDroneWithConvertedPrice = async (droneId: string, targetCurrency: string) => {
  const allowedCurrencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'HKD', 'NZD'];
  const drone = await Drone.findById(droneId);
  if (!drone) throw new Error('Dron no encontrado');
  if (!allowedCurrencies.includes(targetCurrency)) throw new Error('Divisa no soportada');
  let convertedPrice = drone.price;
  if (drone.currency !== targetCurrency) {
    const rate = await getExchangeRate(drone.currency, targetCurrency);
    convertedPrice = Math.round(drone.price * rate * 100) / 100;
  }
  return {
    ...drone.toObject(),
    price: convertedPrice,
    currency: targetCurrency,
    originalPrice: drone.price,
    originalCurrency: drone.currency
  };
};

export interface DronePurchaseItem {
  droneId: string;
  quantity: number;
}

export const purchaseMultipleDrones = async (
  userId: string,
  items: DronePurchaseItem[],
  payWithCurrency: string
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');
  if (!user.balance) user.balance = new Map();
  if (!payWithCurrency) throw new Error('Debes indicar la divisa con la que quieres pagar (payWithCurrency)');
  if (!user.balance.has(payWithCurrency)) throw new Error('No tienes saldo en la divisa seleccionada');

  let total = 0;
  const dronesToUpdate: any[] = [];
  for (const item of items) {
    const drone = await Drone.findById(item.droneId);
    if (!drone) throw new Error(`Dron ${item.droneId} no encontrado`);
    if (drone.ownerId.toString() === userId) throw new Error('No puedes comprar tu propio dron');
    if (drone.status === 'venut') throw new Error(`Dron ${drone.model} ya vendido`);
    if (typeof drone.stock !== 'number' || drone.stock < item.quantity) throw new Error(`Stock insuficiente para el dron ${drone.model}`);
    // Calcular precio en la divisa seleccionada
    let price = drone.price;
    if (drone.currency !== payWithCurrency) {
      const rate = await getExchangeRate(drone.currency, payWithCurrency);
      price = Math.round((drone.price / rate) * 100) / 100;
    }
    total += price * item.quantity;
    dronesToUpdate.push({ drone, quantity: item.quantity });
  }
  const userBalance = user.balance.get(payWithCurrency) || 0;
  if (userBalance < total) throw new Error('Saldo insuficiente en la divisa seleccionada');
  // Descontar saldo
  user.balance.set(payWithCurrency, userBalance - total);
  await user.save();
  // Actualizar stock y marcar vendidos si corresponde
  for (const { drone, quantity } of dronesToUpdate) {
    drone.stock -= quantity;
    if (drone.stock === 0) {
      drone.status = 'venut';
      drone.buyerId = new mongoose.Types.ObjectId(userId);
    }
    await drone.save();
  }
  return { success: true, total, currency: payWithCurrency, user: { ...user.toObject(), balance: Object.fromEntries(user.balance) } };
};

