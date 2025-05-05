// src/controllers/user_controller.ts
import { saveMethod, createUser, updateUser, deleteUser } from '../service/user_service.js';
import { JwtPayload } from 'jsonwebtoken';
import express, { Request, Response } from 'express';
import { verifyRole } from '../middleware/session.js';
import User from '../models/user_models.js';

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
        const data = await createUser(req.body);
        res.json({ message: 'Usuario registrado exitosamente' });
    } catch (error: any) {
        if (error.message === 'Ya existe un usuario con este correo') {
            return res.status(400).json({ message: error.message });
        }
        else if (error.message === 'Ya existe un usuario con este nombre') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

export const getAllUsersHandler = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find({ isDeleted: false }, 'userName email role')
            .skip(skip)
            .limit(limit);

        res.status(200).json(users);
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
        const role = await verifyRole(req, res);
        if(role!== '') {
            return res.status(403).json({ message: role });
        }
        const data = await updateUser(req.params.id, req.body);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteUserHandler = async (req: RequestExt, res: Response) => {
    try {
        const role = await verifyRole(req, res);
        if(role!== '') {
            return res.status(403).json({ message: role });
        }
        const data = await deleteUser(req.params.id);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/*
export const logInHandler = async (req: Request, res: Response) => {
  try {
    const userDoc = await serviceLogIn(req.body.email, req.body.password);
    const { password, ...user } = userDoc.toObject();
    return res.json({ user });
  } catch (err: any) {
    if (err.message === 'Usuario no encontrado o eliminado') {
      return res.status(404).json({ message: err.message });
    }

}
*/

