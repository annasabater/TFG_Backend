//src/middleware/routeNotFound.ts
import { Request, Response } from 'express';

export function routeNotFound(req: Request, res: Response) {
	const error = new Error('Route Not Found');
	res.status(404).json({ error: error.message }); // ojo aqui que si no posem error.message no s'envia l'error!!!
}
