//src/middleware/session.ts

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwtHandler.js";
import  { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../models/user_models.js";

interface RequestExt extends Request {
    user?: string | JwtPayload;
    cookies: Record<string, string>;
}

// Función auxiliar para centralizar de dónde viene el token
const getTokenFromRequest = (req: RequestExt): string | null => {
	const authHeader = req.headers.authorization || req.headers.Authorization;
	if (authHeader?.toString().startsWith("Bearer ")) {
		return authHeader.toString().split(" ").pop() as string;
	}

	if (req.cookies) {
		if (req.cookies.token) return req.cookies.token;
		if (req.cookies.refreshToken) return req.cookies.refreshToken;
	}

	if (req.body?.token) {
		return req.body.token;
	}

	if (req.query?.token) {
		return req.query.token as string;
	}

	return null;
};

const checkJwt = (req: RequestExt, res: Response, next: NextFunction) => {
	try {
		const token = getTokenFromRequest(req);
		if (!token) {
			return res.status(401).json({
				message: "SESSION_NO_VALID",
				details: "Token not provided in headers, cookies, body or query",
				receivedHeaders: Object.keys(req.headers),
			});
		}

		// verifyToken debería devolver el payload o null/false
		const payload = verifyToken(token);
		if (!payload) {
			return res.status(401).json({
				message: "SESSION_NO_VALID",
				details: "Token verification failed or expired",
			});
		}

		req.user = payload;
		next();
	} catch (e) {
		console.error("JWT Error:", e);
		return res.status(400).json({ message: "SESSION_NO_VALID" });
	}
};

const verifyRole = async (req: RequestExt) => {
	try {
		const token = getTokenFromRequest(req);
		if (!token) {
			return "Token no proporcionado en headers, cookies, body o query";
		}

		const payload = verifyToken(token);
		if (!payload) {
			return "Token inválido o expirado";
		}

		// Asumimos que payload tiene un campo `id`
		const user = await User.findById((payload as JwtPayload).id) as IUser;
		if (!user) {
			return "Usuario no encontrado";
		}

		// Permitir que los usuarios cambien sus propias credenciales
		if ((payload as JwtPayload).id === req.params.id) {
			return ""; // Permitir la acción
		}

		// Lógica de rol
		const isAdmin = ["Administrador", "Gobierno"].includes(user.role);
		if (!isAdmin) {
			// Si intenta modificar a otro usuario
			if ((payload as JwtPayload).id !== req.params.id) {
				return "No tienes permiso para hacer cambios en este usuario";
			}
			// Si intenta cambiar su propio rol
			if (user.role !== req.body.role) {
				return "No puedes cambiar tu propio rol";
			}
		}

		return "";
	} catch (err) {
		console.error("verifyRole Error:", err);
		return "Token inválido o expirado";
	}
};

export { checkJwt, verifyRole };