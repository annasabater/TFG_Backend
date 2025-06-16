import { Router } from 'express';
import { registerHandler, loginHandler, logoutHandler,refreshTokenHandler, googleHandler } from '../controllers/auth_controller.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';



const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterUser:
 *       type: object
 *       required:
 *         - userName
 *         - email
 *         - password
 *       properties:
 *         userName:
 *           type: string
 *           example: "test3"
 *         email:
 *           type: string
 *           format: email
 *           example: "test3@gmail.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "123456789Aa$"
 *     LoginUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "test3@gmail.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "123456789Aa$"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID interno del usuario
 *           example: "607f1f77bcf86cd799439011"
 *         token:
 *           type: string
 *           description: JWT para autenticación en rutas protegidas
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Descripción del error"
 *
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     description: Crea un usuario con nombre de usuario, correo y contraseña.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUser'
 *           examples:
 *             EjemploRegistro:
 *               summary: Registro de ejemplo
 *               value:
 *                 userName: "test3"
 *                 email: "test3@gmail.com"
 *                 password: "123456789Aa$"
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Usuario o correo ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/register',authRateLimiter, registerHandler);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica al usuario y devuelve un token JWT.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUser'
 *           examples:
 *             EjemploLogin:
 *               summary: Login de ejemplo
 *               value:
 *                 email: "test3@gmail.com"
 *                 password: "123456789Aa$"
 *     responses:
 *       200:
 *         description: Autenticación exitosa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Datos de login inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/login',authRateLimiter, loginHandler);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Cierra la sesión del usuario y elimina el token JWT.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Cierre de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 */
router.post('/auth/logout',authRateLimiter, logoutHandler);


/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar el token de acceso
 *     description: Genera un nuevo token de acceso utilizando el refresh token.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Token de acceso renovado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
router.post('/auth/refresh',authRateLimiter,refreshTokenHandler);


// Iniciar login con Google
/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     summary: Iniciar sesión con Google
 *     description: Redirige al usuario a la página de inicio de sesión de Google.
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirección a Google para autenticación.
 */
router.post('/auth/google',googleHandler);


export default router;
