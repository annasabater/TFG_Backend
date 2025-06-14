//src/middleware/loggingHandler.ts
import { Request, Response, NextFunction } from 'express';
export function loggingHandler(req: Request, res: Response, next: NextFunction) {
	console.log(`Incoming -Method: [${req.method}] -URL [${req.url}] - IP [${req.socket.remoteAddress}]`);

	res.on('finish', () => {
		const header = req.headers;
		const userAgent = header["user-agent"];
		console.log(`Incoming -Method: [${req.method}] -URL [${req.url}] - IP [${req.socket.remoteAddress}] -STATUS [${req.statusCode}]`);
		console.log("User-aggemt",userAgent);
	});

	next();
}