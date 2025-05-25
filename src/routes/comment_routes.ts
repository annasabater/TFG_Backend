import { Router } from 'express';
import { addCommentHandler, getCommentsByDroneHandler } from '../controllers/comment_controller.js';
import { checkJwt } from '../middleware/session.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Añadir comentario o respuesta a un dron
router.post('/comments', generalRateLimiter, checkJwt, addCommentHandler);

// Obtener todos los comentarios (y respuestas) de un dron
router.get('/comments/:droneId', generalRateLimiter, getCommentsByDroneHandler);

export default router;
