//src/middleware/isOwner.ts
import { Request, Response, NextFunction } from 'express';
import Drone from '../models/drone_models.js';

export const ensureOwner = async (req: Request, res: Response, next: NextFunction) => {
	const drone = await Drone.findById(req.params.id);
	if (!drone) return res.status(404).json({ message: 'Dron no encontrado' });

	// req.user.id prové del teu `checkJwt`
	// @ts-ignore
	if (drone.ownerId.toString() !== req.user?.id) {
		return res.status(403).json({ message: 'No eres el propietario' });
	}
	next();
};
