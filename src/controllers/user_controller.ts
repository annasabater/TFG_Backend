// src/controllers/user_controller.ts
import { saveMethod, createUser, getAllUsers, getUserById, updateUser, deleteUser } from '../service/user_service.js';
import { JwtPayload } from 'jsonwebtoken';
import express, { Request, Response } from 'express';
import { verifyRole } from '../middleware/session.js';

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

export const getAllUsersHandler = async (req: RequestExt, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const data = await getAllUsers(page, limit);
        // Modificación: Filtrar contraseñas antes de enviar la respuesta
        const usersWithoutPasswords = data.map(({ password, ...user }) => user);
        res.json(usersWithoutPasswords);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserByIdHandler = async (req: Request, res: Response) => {
    try {
        const data = await getUserById(req.params.id);
        if (!data || data.isDeleted) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
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

