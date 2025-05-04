import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwtHandler.js";
import jwt, { JwtPayload,verify } from "jsonwebtoken";
import User, { IUser } from "../models/user_models.js";

interface RequestExt extends Request {
    user?: string | JwtPayload;
}

const checkJwt = (req: RequestExt, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization 
                        || req.headers.Authorization
                        || req.body?.token
                        || req.query?.token
                        || null;

        if (!authHeader) {
            console.log('Headers recibidos:', req.headers); // Debug
            return res.status(401).json({ 
                message: 'SESSION_NO_VALID',
                details: 'Token not provided in headers, body or query',
                receivedHeaders: Object.keys(req.headers) // Para debug
            });
        }

        // 2. Extraer el token del formato Bearer
        const token = authHeader.toString().split(' ').pop();
        console.log('Token extraído:', token); // Debug
        if (!token) {
            return res.status(401).json({
                message: 'SESSION_NO_VALID',
                details: 'Invalid token format. Use: Bearer <token>'
            });
        }

        // 3. Verificar el token
        const isUser = verifyToken(`${token}`);
        if(!isUser) {
            return res.status(401).json({
                message: 'SESSION_NO_VALID',
                details: 'Token verification failed'
            });
        }else {
            req.user = isUser
            console.log(authHeader); // Debug
            next();
        }

    } catch (e) {
        console.error('JWT Error:', e);
        return res.status(400).send('SESSION_NO_VALID');
    }
};

const verifyRole = async (req: RequestExt, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return 'Token no proporcionado en los headers, body o query';
        }
        
        // 2. Extraer el token del formato Bearer
        const token = authHeader.toString().split(' ').pop();
        const payload = verifyToken(`${token}`)

        if (!payload) {
            return 'Token inválido o expirado';
        }
        const user = await User.findById(payload.id);
        if(user && user.role !== 'Administrador' && user.role !== 'Gobierno') {
            if ((payload.id !== req.params.id)){
                // Si no es el mismo usuario y no es Admin
                return 'No tienes permiso para hacer cambios en este usuario';
            }else if(payload.id === req.params.id && (user && user.role !== req.body.role)) {
                //same id but lower role
                return 'No puedes cambiar tu propio rol';
            }
        }
        return '';
    } catch (err) {
      return 'Token inválido o expirado'
    }
};

export { checkJwt, verifyRole };