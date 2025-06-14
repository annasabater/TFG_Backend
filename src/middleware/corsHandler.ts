//src/middleware/corsHandler.ts
import { Request, Response, NextFunction } from 'express';

export function corsHandler(req: Request, res: Response, next: NextFunction) {
	// Permitir el origen que venga en la petición (o todos si no viene)
	res.header('Access-Control-Allow-Origin', req.header('origin') || '*');
	// Cabeceras permitidas
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	// Permitir el envío de cookies si se necesitan
	res.header('Access-Control-Allow-Credentials', 'true');

	if (req.method === 'OPTIONS') {
		// Métodos permitidos en preflight
		res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
		// Respondemos directamente y NO llamamos a next()
		return res.sendStatus(200);
	}

	next();
}

