// src/services/user_service.ts
import User, { IUser } from '../models/user_models.js';
import { encrypt, verify } from '../utils/bcryptHandler.js';

export const saveMethod = () => {
    return 'Hola';
};
export const createUser = async (userData: IUser) => {
    const user = new User(userData);
    return await user.save();
};

export const getAllUsers = async (page: number, limit: number) => {
    const skip = (page - 1) * limit;
    return await User.find({ isDeleted: false }).skip(skip).limit(limit);
};

export const getUserById = async (id: string) => {
    return await User.findOne({ _id: id, isDeleted: false });
};

export const updateUser = async (id: string, updateData: Partial<IUser>) => {
    const authUser = await User.findOne({ _id: id, isDeleted: false });
    if (!authUser) throw new Error('Usuario no encontrado o eliminado');
    if(updateData.password !== undefined){
        const passwordChanged = verify(updateData.password, authUser.password);
        const hashedPassword = await encrypt(updateData.password);
        console.log(hashedPassword)
        updateData.password = hashedPassword; // Encriptar la nueva contraseña
    }
    const newUser = await User.updateOne({ _id: id, isDeleted: false }, { $set: updateData });
    return updateData;
};

export const deleteUser = async (id: string) => {
    return await User.updateOne({ _id: id }, { isDeleted: true });
};

export const getFollowingUsers = async (userId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const user = await User.findById(userId)
    .populate({
      path: 'following',
      select: 'userName email',
      options: { skip, limit }
    });
  if (!user) throw new Error('Usuario no encontrado');
  return user.following;
};
/*
export const logIn = async (email: string, password: string) => { 
    try {
        // Buscar al usuario en la base de datos
        const user = await User.findOne({ email, isDeleted: false });
        if (!user) {
            throw new Error('Usuario no encontrado o eliminado');
        }
        if (!isMatch) {
            throw new Error('Contraseña incorrecta');
        }

        return user; // Credenciales correctas, devuelve el usuario
    } catch (error: any) {
        throw new Error(error.message || 'Error al iniciar sesión');
    }
};*/