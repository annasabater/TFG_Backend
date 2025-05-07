//src/utils/jwtHandler.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser } from '../models/user_models.js';

const {sign, verify} = jwt;
const JWT_SECRET = process.env.JWT_SECRET || 'tokenSecret0112';

const generateToken = (id:string) => {
    // Convertimos a string y unificamos el nombre de la clave
    return sign({id,valid:true}, JWT_SECRET,{ expiresIn: '15m' });
};

const generateRefreshToken = (id:string) => {
    // Convertimos a string y unificamos el nombre de la clave
    return sign({id,valid:true}, JWT_SECRET,{ expiresIn: '1y' });
};  

const verifyToken = (token:string) => {
    try {
        const decoded = verify(token, JWT_SECRET)  as { id: string; valid:boolean; iat: number; exp: number };
        return decoded;
    } catch (error) {
        return null;
    }
};


export {generateToken,generateRefreshToken, verifyToken};