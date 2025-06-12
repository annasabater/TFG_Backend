import { Router } from 'express';
import { ensureOwner } from '../middleware/isOwner.js';
import { checkJwt } from '../middleware/session.js';
import {
  createDroneHandler,
  deleteDroneHandler,
  getDronesHandler,
  getDroneByIdHandler,
  updateDroneHandler,
  addDroneReviewHandler,
  getDronesByCategoryHandler,
  getDronesByPriceRangeHandler,
  addFavoriteHandler,
  removeFavoriteHandler,
  getFavoritesHandler,
  getMyDronesHandler,
  purchaseDroneHandler,
} from '../controllers/drone_controller.js';
import { uploadImages, validateMinImages } from '../middleware/upload.js';

import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Drones
 *   description: Gestión de drones
 */

/**
 * @openapi
 * /api/drones:
 *   get:
 *     summary: Obtener todos los drones (filtros y paginación)
 *     tags: [Drones]
 *     parameters:
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *         description: Precio máximo
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Búsqueda parcial por nombre (case-insensitive)
 *       - in: query
 *         name: model
 *         schema: { type: string }
 *         description: Modelo del dron
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [venta, alquiler] }
 *         description: Categoría
 *       - in: query
 *         name: condition
 *         schema: { type: string, enum: [nuevo, usado] }
 *         description: Condición
 *       - in: query
 *         name: minRating
 *         schema: { type: number, minimum: 1, maximum: 5 }
 *         description: Rating promedio mínimo (solo comentarios raíz)
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *         description: Página actual
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 20 }
 *         description: Elementos por página (máx. 20)
 *     responses:
 *       200:
 *         description: Lista filtrada de drones
 *
 *   post:
 *     summary: Crear un nuevo dron
 *     description: Crea un nuevo dron con imágenes (mínimo 1, máximo 4).
 *     tags: [Drones]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - ownerId
 *               - model
 *               - price
 *               - category
 *               - condition
 *               - location
 *               - images
 *             properties:
 *               ownerId:
 *                 type: string
 *               model:
 *                 type: string
 *               price:
 *                 type: number
 *               details:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [venta, alquiler]
 *               condition:
 *                 type: string
 *                 enum: [nuevo, usado]
 *               location:
 *                 type: string
 *               contact:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 minItems: 1
 *                 maxItems: 4
 *           encoding:
 *             images:
 *               style: form
 *               explode: false
 *     responses:
 *       201:
 *         description: Dron creado correctamente
 *       400:
 *         description: Error en la creación del dron
 *       500:
 *         description: Error interno del servidor
 */
router.get('/drones', generalRateLimiter, getDronesHandler);

/**
 * @openapi
 * /api/drones/{id}:
 *   get:
 *     summary: Obtener un dron por ID
 *     tags:
 *       - Drones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del dron
 *     responses:
 *       200:
 *         description: Datos del dron
 *       404:
 *         description: Dron no encontrado
 */
router.get('/drones/:id',generalRateLimiter, getDroneByIdHandler);

/**
 * @openapi
 * /api/drones:
 *   post:
 *     summary: Crear un nuevo dron
 *     description: Crea un nuevo dron con los datos proporcionados.
 *     tags:
 *       - Drones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ownerId:
 *                 type: string
 *               model:
 *                 type: string
 *               price:
 *                 type: number
 *               details:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [venta, alquiler]
 *               condition:
 *                 type: string
 *                 enum: [nuevo, usado]
 *               location:
 *                 type: string
 *               contact:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             ownerId: "string"
 *             model: "string"
 *             price: 0
 *             details: "string"
 *             category: "venta"
 *             condition: "nuevo"
 *             location: "string"
 *             contact: "string"
 *             images:
 *               - "string"
 *     responses:
 *       201:
 *         description: Dron creado correctamente
 *       400:
 *         description: Error en la creación del dron
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  '/drones',
  generalRateLimiter,
  checkJwt,
  uploadImages,
  validateMinImages,
  createDroneHandler
);

/**
 * @openapi
 * /api/drones/{id}:
 *   put:
 *     summary: Actualizar un dron existente
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *               price:
 *                 type: number
 *               details:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [venta, alquiler]
 *               condition:
 *                 type: string
 *                 enum: [nuevo, usado]
 *               location:
 *                 type: string
 *               contact:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 minItems: 1
 *                 maxItems: 4
 *               status:
 *                 type: string
 *                 enum: [actiu, venut]
 *           encoding:
 *             images:
 *               style: form
 *               explode: false
 *           example:
 *             model: "DJI Mini 3"
 *             price: 500
 *             details: "Dron en perfecto estado, poco uso."
 *             category: "venta"
 *             condition: "usado"
 *             location: "Barcelona"
 *             contact: "email@ejemplo.com"
 *             status: "actiu"
 *     responses:
 *       200:
 *         description: Dron actualizado correctamente
 *       404:
 *         description: Dron no encontrado
 */
router.put(
  '/drones/:id',
  generalRateLimiter,
  checkJwt,
  ensureOwner,
  uploadImages,
  validateMinImages,
  updateDroneHandler
);

/**
 * @openapi
 * /api/drones/{id}:
 *   delete:
 *     summary: Eliminar un dron
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Dron eliminado correctamente }
 *       404: { description: Dron no encontrado }
 */
router.delete(
  '/drones/:id',
  generalRateLimiter,
  checkJwt,
  ensureOwner,
  deleteDroneHandler
);

/**
 * @openapi
 * /api/drones/{id}/review:
 *   post:
 *     summary: Agregar reseña a un dron
 *     tags:
 *       - Drones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dron a reseñar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - rating
 *               - comment
 *             properties:
 *               userId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reseña agregada correctamente
 *       404:
 *         description: Dron o usuario no encontrado
 */
router.post('/drones/:id/review',generalRateLimiter, addDroneReviewHandler);

/**
 * @openapi
 * /api/drones/category/{category}:
 *   get:
 *     summary: Obtener drones por categoría
 *     tags:
 *       - Drones
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Categoría de los drones a buscar
 *     responses:
 *       200:
 *         description: Lista de drones en la categoría especificada
 */
router.get('/drones/category/:category',generalRateLimiter, getDronesByCategoryHandler);

/**
 * @openapi
 * /api/drones/price:
 *   get:
 *     summary: Obtener drones por rango de precio
 *     tags:
 *       - Drones
 *     parameters:
 *       - in: query
 *         name: min
 *         required: true
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: max
 *         required: true
 *         schema:
 *           type: number
 *         description: Precio máximo
 *     responses:
 *       200:
 *         description: Drones encontrados en el rango de precio
 *       400:
 *         description: Parámetros de precio inválidos
 */
router.get('/drones/price',generalRateLimiter, getDronesByPriceRangeHandler);

/**
 * @openapi
 * /api/users/{userId}/favourites/{droneId}:
 *   post:
 *     summary: Añadir un dron a favoritos
 *     tags: [Favourites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: droneId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista actualizada de favoritos }
 *   delete:
 *     summary: Eliminar un dron de favoritos
 *     tags: [Favourites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: droneId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista actualizada de favoritos }
 *
 * /api/users/{userId}/favourites:
 *   get:
 *     summary: Obtener lista de favoritos de un usuario
 *     tags: [Favourites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lista paginada de favoritos }
 */
router.post(
  '/users/:userId/favourites/:droneId',
  generalRateLimiter,
  checkJwt,            
  addFavoriteHandler
);

router.delete(
  '/users/:userId/favourites/:droneId',
  generalRateLimiter,
  checkJwt,            
  removeFavoriteHandler
);

router.get(
  '/users/:userId/favourites',
  generalRateLimiter,
  checkJwt,            
  getFavoritesHandler
);

/**
 * @openapi
 * /api/users/{userId}/my-drones:
 *   get:
 *     summary: Llistar anuncis propis
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, sold] }
 *         description: Filtra per pendents o venuts
 *     responses:
 *       200: { description: Llista d’anuncis }
 */
router.get(
  '/users/:userId/my-drones',
  generalRateLimiter,
  checkJwt,            
  getMyDronesHandler
);


/**
 * @openapi
 * /api/drones/{id}/purchase:
 *   post:
 *     summary: Comprar un dron i marcar-lo com venut
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dron a comprar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *                 description: Adreça d'enviament
 *               phone:
 *                 type: string
 *                 description: Telèfon de contacte
 *           example:
 *             address: "C/ Exemple, 123, Ciutat"
 *             phone: "+34912345678"
 *     responses:
 *       200:
 *         description: Dron comprat i marcat com venut
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Drone'
 *       404:
 *         description: Dron no trobat
 *       500:
 *         description: Error intern del servidor
 */
router.post(
  '/drones/:id/purchase',
  generalRateLimiter,
  checkJwt,
  purchaseDroneHandler
);

/**
 * @openapi
 * /api/drones/{id}/sold:
 *   put:
 *     summary: Marcar un dron com venut
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dron a marcar com venut
 *     responses:
 *       200:
 *         description: Dron marcat com venut
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Drone'
 *       404:
 *         description: Dron no trobat
 *       500:
 *         description: Error intern del servidor
 */
router.put(
  '/drones/:id/sold',
  generalRateLimiter,
  checkJwt,
  ensureOwner,
  purchaseDroneHandler
);


export default router;
