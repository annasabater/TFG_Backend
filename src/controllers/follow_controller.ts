//src/controllers/follow_controller.ts

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user_models.js';
import { pushNotification } from '../service/notification_service.js'; 

export const followUser = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).userId as string;
    const targetId   = req.params.userId;

    if (followerId === targetId) {
      return res.status(400).json({ message: 'No puedes seguirte a ti mismo' });
    }

    const targetObjectId = new mongoose.Types.ObjectId(targetId);
    const user = await User.findById(followerId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (!user.following.some(id => id.equals(targetObjectId))) {
      user.following.push(targetObjectId);
      await user.save();

      // Notificació de FOLLOW
      await pushNotification({
        to:   targetId,
        from: followerId,
        type: 'follow'
      });
    }

    res.status(200).json({ message: 'Seguido correctamente' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).userId as string;
    const targetId   = req.params.userId;
    const targetObj  = new mongoose.Types.ObjectId(targetId);

    const user = await User.findById(followerId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.following = user.following.filter(id => !id.equals(targetObj));
    await user.save();

    res.status(200).json({ message: 'Dejaste de seguir al usuario' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
