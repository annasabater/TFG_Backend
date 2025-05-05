import Drone, { IDrone } from '../models/drone_models.js';
import User from '../models/user_models.js';

// Add user validation to ensure the user is not deleted
const validateUserNotDeleted = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
        throw new Error('Usuario no encontrado o eliminado');
    }
};

// Permite que los usuarios publiquen drones en venta o alquiler
export const createDrone = async (droneData: IDrone) => {
    await validateUserNotDeleted(droneData.ownerId);
    const drone = new Drone(droneData);
    await drone.save();
    return drone;
};

// Get all drones with pagination
export const getDrones = async (page: number, limit: number) => {
    const skip = (page - 1) * limit;
    return await Drone.find().skip(skip).limit(limit);
};

// Obtiene la información detallada de un dron, incluyendo el vendedor
export const getDroneById = async (id: string) => {
    return await Drone.findById(id)
};

//obtiene al dueño del drone
export const getOwnerByDroneId = async (id: string) => {
    return await Drone.findById(id).populate('ownerId', 'name email');
};

// Permite que los vendedores editen su publicación
export const updateDrone = async (id: string, updateData: Partial<IDrone>) => {
    return await Drone.findByIdAndUpdate(id, updateData, { new: true });
};

// Permite que los vendedores eliminen su publicación
export const deleteDrone = async (id: string) => {
    return await Drone.findByIdAndDelete(id);
};

// Filtra drones en un rango de precios
export const getDronesByCategory = async (category: string) => {
    return await Drone.find({ category });
};

// Obtener drones dentro de un rango de precios
export const getDronesByPriceRange = async (min: number, max: number) => {
    return await Drone.find({ price: { $gte: min, $lte: max } });
};

// Agregar una reseña a un dron. Los compradores pueden calificar y comentar sobre drones que han adquirido
export const addReviewToDrone = async (droneId: string, userId: string, rating: number, comment: string) => {
    const drone = await Drone.findById(droneId);
    if (!drone) return null;

    const user = await User.findById(userId);
    if (!user) return null;

    drone.ratings.push({ userId, rating, comment });
    await drone.save();
    return drone;
};