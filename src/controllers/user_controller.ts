// src/controllers/user_controller.ts

import { saveMethod, createUser, updateUser, deleteUser, getUserBalance, addUserBalance } from '../service/user_service.js';
import { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { verifyRole } from '../middleware/session.js';
import User from '../models/user_models.js';
import mongoose from 'mongoose';

interface RequestExt extends Request {
    user?: string | JwtPayload;
}

// GET /api/main
export const saveMethodHandler = (_req: Request, res: Response) => {
	const msg = saveMethod();
	res.json({ message: msg });
};

// POST /api/users/signup
export const createUserHandler = async (req: Request, res: Response) => {
	try {
		await createUser(req.body);
		res.json({ message: 'Usuario registrado exitosamente' });
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (error.message === 'Ya existe un usuario con este correo') {
				return res.status(400).json({ message: error.message });
			}
			else if (error.message === 'Ya existe un usuario con este nombre') {
				return res.status(400).json({ message: error.message });
			}
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: String(error) });
		}
	}
};

// src/controllers/user_controller.ts
export const getAllUsersHandler = async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const skip = (page - 1) * limit;

		const filter: Record<string, unknown> = { isDeleted: false };

		// Filtros existentes
		if (req.query.userName) {
			filter.userName = { $regex: req.query.userName, $options: 'i' };
		}
		if (req.query.email) {
			filter.email = { $regex: req.query.email, $options: 'i' };
		}
		if (req.query.role) {
			filter.role = req.query.role;
		}

		// 🆕 Filtro por ID exacto (string que parezca un ObjectId válido)
		if (req.query._id && mongoose.Types.ObjectId.isValid(req.query._id.toString())) {
			filter._id = new mongoose.Types.ObjectId(req.query._id.toString());
		}

		const [users, total] = await Promise.all([
			User.find(filter, 'userName email role').skip(skip).limit(limit),
			User.countDocuments(filter)
		]);

		const pages = Math.ceil(total / limit);

		res.status(200).json({ users, pages });
	} catch (error) {
		console.error('Error fetching users:', error);
		res.status(500).json({ message: 'Error fetching users' });
	}
};



export const getUserByIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id, 'userName email role');
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.status(200).json(user);
	} catch (error) {
		console.error('Error fetching user by ID:', error);
		res.status(500).json({ message: 'Error fetching user by ID' });
	}
};

export const updateUserHandler = async (req: RequestExt, res: Response) => {
	try {
		const role = await verifyRole(req);
		if(role!== '') {
			return res.status(403).json({ message: role });
		}
		const data = await updateUser(req.params.id, req.body);
		res.json(data);
	} catch (error: unknown) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: String(error) });
		}
	}
};

export const deleteUserHandler = async (req: RequestExt, res: Response) => {
	try {
		const role = await verifyRole(req);
		if(role!== '') {
			return res.status(403).json({ message: role });
		}
		const data = await deleteUser(req.params.id);
		res.json(data);
	} catch (error: unknown) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: String(error) });
		}
	}
};

export const getUserBalanceHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const balance = await getUserBalance(id);
		res.status(200).json(balance);
	} catch (error) {
		const errMsg = error instanceof Error ? error.message : 'Error inesperado';
		res.status(500).json({ message: errMsg });
	}
};

export const addUserBalanceHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { amount, currency } = req.body;
		if (!amount || !currency) {
			return res.status(400).json({ message: 'amount y currency son requeridos' });
		}
		const balance = await addUserBalance(id, amount, currency);
		res.status(200).json(balance);
	} catch (error) {
		const errMsg = error instanceof Error ? error.message : 'Error inesperado';
		res.status(500).json({ message: errMsg });
	}
};

/*
export const logInHandler = async (req: Request, res: Response) => {
  try {
    const userDoc = await serviceLogIn(req.body.email, req.body.password);
    const { password, ...user } = userDoc.toObject();
    return res.json({ user });
  } 
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	catch (err: any) {
    if (err.message === 'Usuario no encontrado o eliminado') {
      return res.status(404).json({ message: err.message });
    }

}
*/

