import { Request, Response } from 'express';
import { addComment, getCommentsByDrone } from '../service/comment_service.js';

export const addCommentHandler = async (req: Request, res: Response) => {
  try {
    const { droneId, userId, text, rating, parentCommentId } = req.body;
    if (!droneId || !userId || !text) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'El rating debe estar entre 1 y 5' });
    }
    const comment = await addComment({ droneId, userId, text, rating, parentCommentId });
    res.status(201).json(comment);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getCommentsByDroneHandler = async (req: Request, res: Response) => {
  try {
    const { droneId } = req.params;
    const comments = await getCommentsByDrone(droneId);
    res.status(200).json(comments);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
