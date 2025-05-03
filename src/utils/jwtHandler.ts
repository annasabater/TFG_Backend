import jwt from 'jsonwebtoken';
import { IUser } from '../models/user_models.js';

const {sign, verify} = jwt;
const JWT_SECRET = process.env.JWT_SECRET || 'tokenSecret0112';
const generateToken = (user: IUser) => {
    // Convertimos a string y unificamos el nombre de la clave
    return sign(
      { id: (user._id ?? '').toString() },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
};
  

const verifyToken = (token:string) => {
    try {
        const decoded = verify(token, JWT_SECRET)  as { id: string; role: string; iat: number; exp: number };
        return decoded;
    } catch (error) {
        return null;
    }
};

export {generateToken, verifyToken};