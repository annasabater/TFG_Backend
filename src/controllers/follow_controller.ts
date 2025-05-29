// src/controllers/follow_controller.ts

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user_models.js';

export const followUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const targetId = req.params.userId;

    if (userId === targetId) {
      return res.status(400).json({ message: 'No puedes seguirte a ti mismo' });
    }

    const targetObjectId = new mongoose.Types.ObjectId(targetId);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (!user.following.some(id => id.equals(targetObjectId))) {
      user.following.push(targetObjectId);
      await user.save();
    }

    res.status(200).json({ message: 'Seguido correctamente' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const targetId = req.params.userId;
    const targetObjectId = new mongoose.Types.ObjectId(targetId);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.following = user.following.filter(
      id => !id.equals(targetObjectId)
    );
    await user.save();

    res.status(200).json({ message: 'Dejaste de seguir al usuario' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

