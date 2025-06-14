// src/middleware/upload.ts

import multer from 'multer';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

export const UPLOAD_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
	filename   : (_req, file, cb) => cb(null, uuid() + path.extname(file.originalname)),
});

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
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
	limits: { files: 4, fileSize: 5 * 1024 * 1024 }, // máximo 4 imágenes
}).array('images', 4);

// Middleware para validar mínimo 1 imagen
export function validateMinImages(req: Request, res: Response, next: NextFunction) {
	if (!req.files || (Array.isArray(req.files) && req.files.length < 1)) {
		return res.status(400).json({ message: 'Debes subir al menos 1 imagen.' });
	}
	next();
}
