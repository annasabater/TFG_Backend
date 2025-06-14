// src/middleware/upload.ts
import multer, { FileFilterCallback } from 'multer';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

export const UPLOAD_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
	destination: (
		req: Request,
		file: Express.Multer.File,
		cb: (error: Error | null, destination: string) => void
	) => {
		cb(null, UPLOAD_DIR);
	},
	filename: (
		req: Request,
		file: Express.Multer.File,
		cb: (error: Error | null, filename: string) => void
	) => {
		const uniqueName = uuid() + path.extname(file.originalname);
		cb(null, uniqueName);
	},
});

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: FileFilterCallback
) => {
	const ext = path.extname(file.originalname).toLowerCase();
	if (allowedExtensions.includes(ext)) {
		cb(null, true);
	} else {
		cb(new Error('Solo se permiten imágenes (jpg, jpeg, png, webp)'));
	}
};

export const upload = multer({ storage });

export const uploadImages = multer({
	storage,
	fileFilter,
	limits: { files: 4, fileSize: 5 * 1024 * 1024 }, // máximo 4 imágenes de hasta 5MB cada una
}).array('images', 4);

// Middleware para validar mínimo 1 imagen
export function validateMinImages(
	req: Request,
	res: Response,
	next: NextFunction
) {
	// multer añade `req.files` como `Express.Multer.File[] | undefined`
	const files = req.files as Express.Multer.File[] | undefined;
	if (!files || files.length < 1) {
		return res.status(400).json({ message: 'Debes subir al menos 1 imagen.' });
	}
	next();
}
