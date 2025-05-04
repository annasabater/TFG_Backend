import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser } from '../models/user_models.js';

const {sign, verify} = jwt;
const JWT_SECRET = process.env.JWT_SECRET || 'tokenSecret0112';
const generateToken = (id:string) => {
    // Convertimos a string y unificamos el nombre de la clave
    
    //const signature = crypto.createHash('sha256').update(user._id.toString()).digest('base64');
    return sign({id}, JWT_SECRET,{ expiresIn: '1h' });
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