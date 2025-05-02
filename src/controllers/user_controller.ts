// src/controllers/user_controller.ts

import { Request, Response } from 'express';
import {
  saveMethod,
  createUser as serviceCreateUser,
  getAllUsers as serviceGetAllUsers,
  getUserById as serviceGetUserById,
  updateUser as serviceUpdateUser,
  deleteUser as serviceDeleteUser,
  logIn as serviceLogIn
} from '../service/user_service.js';

// GET /api/main
export const saveMethodHandler = (_req: Request, res: Response) => {
  const msg = saveMethod();
  res.json({ message: msg });
};

// POST /api/users/signup
export const createUserHandler = async (req: Request, res: Response) => {
  try {
    const userDoc = await serviceCreateUser(req.body);
    // Quitar la contraseña antes de enviar
    const { password, ...user } = userDoc.toObject();
    return res.status(201).json({ user });
  } catch (err: any) {
    if (
      err.message.includes('correo') ||
      err.message.includes('nombre de usuario')
    ) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};

// POST /api/users/login
export const logInHandler = async (req: Request, res: Response) => {
  try {
    const userDoc = await serviceLogIn(req.body.email, req.body.password);
    const { password, ...user } = userDoc.toObject();
    return res.json({ user });
  } catch (err: any) {
    if (err.message === 'Usuario no encontrado o eliminado') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === 'Contraseña incorrecta') {
      return res.status(401).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/users?page=1&limit=10
export const getAllUsersHandler = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const users = await serviceGetAllUsers(page, limit);
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id
export const getUserByIdHandler = async (req: Request, res: Response) => {
  try {
    const userDoc = await serviceGetUserById(req.params.id);
    if (!userDoc) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const { password, ...user } = userDoc.toObject();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id
export const updateUserHandler = async (req: Request, res: Response) => {
  try {
    const result = await serviceUpdateUser(req.params.id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/:id
export const deleteUserHandler = async (req: Request, res: Response) => {
  try {
    const result = await serviceDeleteUser(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
