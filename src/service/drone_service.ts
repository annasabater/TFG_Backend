import Drone, { IDrone } from '../models/drone_models.js';
import User               from '../models/user_models.js';
import mongoose           from 'mongoose';

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
  
