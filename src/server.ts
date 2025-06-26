// src/server.ts

import express        from 'express';
import http           from 'http';
import mongoose       from 'mongoose';
import dotenv         from 'dotenv';
import path           from 'path';
import cookieParser   from 'cookie-parser';
import { Server }     from 'socket.io';

import userRoutes     from './routes/user_routes.js';
import forumRoutes    from './routes/forum_routes.js';
import droneRoutes    from './routes/drone_routes.js';
import authRoutes     from './routes/auth_routes.js';
import messageRoutes  from './routes/message_routes.js';
import sessionRoutes  from './routes/session_routes.js';
import socialRoutes   from './routes/social_routes.js';
import commentRoutes  from './routes/comment_routes.js';
import conversationRoutes from './routes/conversation_routes.js';
import rateLimit from 'express-rate-limit';

import { corsHandler }     from './middleware/corsHandler.js';
import { loggingHandler }  from './middleware/loggingHandler.js';
import { routeNotFound }   from './middleware/routeNotFound.js';
import { UPLOAD_DIR }      from './middleware/upload.js';     
import swaggerUi           from 'swagger-ui-express';
import swaggerJSDoc        from 'swagger-jsdoc';

import { verifyToken } from './utils/jwtHandler.js';
import User            from './models/user_models.js';
import { Message }     from './models/message_models.js';
import notificationRoutes from './routes/notification_routes.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Carga el .env desde la carpeta raíz 
dotenv.config({
	path: path.resolve(__dirname, '../.env'),
});

const app        = express();
app.set('trust proxy', 1);

const LOCAL_PORT = process.env.SERVER_PORT || 9000;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${LOCAL_PORT}`;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,   // 15 min
  max: 100,                    // 100 peticiones/IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, _res) => req.ip ?? '',
});

app.use('/api', apiLimiter);

// Configuración de Swagger
const path_constant = process.env.SWAGGER_PATH || './routes/*.js';
const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'API de Usuarios',
			version: '1.0.0',
			description: 'Documentación de la API de Usuarios'
		},
		tags: [
			{
				name: 'Users',
				description: 'Rutas relacionadas con la gestión de usuarios',
			},
			{
				name: 'Forum',
				description: 'Rutas relacionadas con el forum',
			},
			{
				name: 'Drones',
				description: 'Rutas relacionadas con el drone',
			},
			{
				name: 'Main',
				description: 'Rutas principales de la API',
			},
			{ 
				name: 'Payments', 
				description: 'Procesamiento de pagos' ,
			},
			{ 
				name: 'Messages', 
				description: 'Mensajería entre usuarios' ,
			},
			{ 
				name: 'Juegos', 
				description: 'Juegos entre usuarios' ,
			},
			{ 
				name: 'Social media', 
				description: 'Red social de usuarios' ,
			},
			{ 
				name: 'Auth', 
				description: 'Registro y Login de usuarios' ,
			},
			{
				name: 'Notifications',
				description: 'Endpoints per gestionar notificacions (likes, comentaris, seguiments)'
			}
		],
		servers: [
			{
				url: SERVER_URL
			}
		]
	},
	apis: [path_constant] 
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Middlewares globales
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use(cookieParser());
app.use(loggingHandler);
app.use(corsHandler);

// Rutas REST
app.use('/api', userRoutes);
app.use('/api', forumRoutes);
app.use('/api', droneRoutes);
app.use('/api', sessionRoutes);
app.use('/api', authRoutes);
app.use('/api', messageRoutes);
app.use('/api', socialRoutes);
app.use('/api', commentRoutes);
app.use('/api', conversationRoutes);
app.use('/api', notificationRoutes);
app.use('/uploads', express.static(UPLOAD_DIR));

// Ruta de prueba
app.get('/', (_req, res) => {
	res.send('Welcome to my API');
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ExampleDatabase')
	.then(() => console.log('Connected to DB'))
	.catch(error => console.error('DB Connection Error:', error));

// Configuración de Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  pingInterval : 30000,   // envía un ping cada 30 s
  pingTimeout  : 90000,   // espera hasta 90 s el pong
});

const gameState: {
  [sessionId: string]: {
    fences: { drone: string; geometry: any }[];
    obstacles: { drone: string; geometry: any }[];
  };
} = {};

//  Namespace de alumnos (/jocs)
const jocsNsp = io.of('/jocs');
const competitorEmails = new Set([
	'dron_azul1@upc.edu',
	'dron_verde1@upc.edu',
	'dron_rojo1@upc.edu',
	'dron_amarillo1@upc.edu',
]);

jocsNsp.use(async (socket, next) => {
	// Si viene como espectador, saltamos autenticación
	if (socket.handshake.query?.spectator === 'true') {
		return next();
	}

	// Autenticación normal para drones competidores
	try {
		const token = socket.handshake.auth?.token;
		if (!token) throw new Error('No token');
		const payload = verifyToken(token);
		const user = await User.findById((payload as any).id);
		if (!user || user.isDeleted || !competitorEmails.has(user.email)) {
			throw new Error('Unauthorized');
		}
		socket.data.userId = user._id.toString();
		socket.data.email  = user.email;
		next();
	} catch (err) {
		next(new Error('Authentication error'));
	}
});

jocsNsp.on('connection', socket => {

socket.on('disconnect', () => {
	const { sessionId } = socket.data;
	if (!sessionId) return;

	setTimeout(() => {
		const room = jocsNsp.adapter.rooms.get(sessionId);
		if (!room || room.size === 0) {
		delete gameState[sessionId];
		console.log(`[GC] state de ${sessionId} purgado tras timeout`);
		}
	}, 30_000);
	});

  socket.on('join', ({ sessionId }) => {
    if (!sessionId) return;                
	socket.data.sessionId = sessionId;
    socket.join(sessionId);

    const state = (gameState[sessionId] ??= { fences: [], obstacles: [] });

    state.fences.forEach(({ drone, geometry }) => {
      socket.emit('state_update', { drone, action: 'fence_add',    payload: { geometry } });
    });
    state.obstacles.forEach(({ drone, geometry }) => {
      socket.emit('state_update', { drone, action: 'obstacle_add', payload: { geometry } });
    });

    const room              = jocsNsp.adapter.rooms.get(sessionId) ?? new Set();
    const emailsInRoom      = [...room]
      .map(id => jocsNsp.sockets.get(id)?.data?.email)
      .filter(Boolean);

    const competitorConnected = emailsInRoom.filter(e => competitorEmails.has(e));
    const count               = competitorConnected.length;

    jocsNsp.to(sessionId).emit('waiting', {
      msg   : `Esperando jugadores: ${count}`,
      drones: competitorConnected,
    });
    profNsp.emit('lobbyUpdate', { sessionId, count });
  });

  socket.on('game_ended', ({ sessionId }) => {
    delete gameState[sessionId];
    jocsNsp.to(sessionId).emit('game_ended', { sessionId });
  });

  socket.on('control', ({ sessionId, action, payload }) => {
    jocsNsp.to(sessionId).emit('state_update', {
      drone : socket.data.email,
      action,
      payload,
      by    : socket.data.userId,
    });
  });

  socket.on('telemetry', ({ sessionId, drone, lat, lon, heading }) => {
    jocsNsp.to(sessionId).emit('state_update', {
      drone,
      action : 'telemetry',
      payload: { lat, lon, heading },
    });
  });

  socket.on('bullet', ({ sessionId, drone, bulletId, lat, lon, event }) => {
    jocsNsp.to(sessionId).emit('state_update', {
      drone,
      action : `bullet_${event}`,
      payload: { bulletId, lat, lon },
    });
  });

  socket.on('fence', ({ sessionId, drone, fenceType, geometry, event }) => {
    const state = (gameState[sessionId] ??= { fences: [], obstacles: [] });

    if (event === 'add') {
      const exists = state.fences
        .some(f => f.drone === drone && JSON.stringify(f.geometry) === JSON.stringify(geometry));
      if (!exists) state.fences.push({ drone, geometry });
    } else if (event === 'remove') {
      state.fences = [];
    }

    jocsNsp.to(sessionId).emit('state_update', {
      drone,
      action : `fence_${event}`,
      payload: { fenceType, geometry },
    });
  });

  /* ── Puntuación ───────────────────────────────────────────── */
  socket.on('score', ({ sessionId, drone, score }) => {
    jocsNsp.to(sessionId).emit('state_update', {
      drone,
      action : 'score_update',
      payload: { score },
    });
  });

  socket.on('drone_state', ({ sessionId, drone, state }) => {
    jocsNsp.to(sessionId).emit('state_update', {
      drone,
      action : 'state',
      payload: { state },
    });
  });

  socket.on('obstacle', ({ sessionId, drone, type, geometry, event }) => {
    const state = (gameState[sessionId] ??= { fences: [], obstacles: [] });

    if (event === 'add') {
      state.obstacles.push({ drone, geometry });
    } else if (event === 'remove') {
      state.obstacles = state.obstacles
        .filter(o => JSON.stringify(o.geometry) !== JSON.stringify(geometry));
    }

    jocsNsp.to(sessionId).emit('state_update', {
      drone,
      action : `obstacle_${event}`,
      payload: { type, geometry },
    });
  });
});


// Namespace del profesor (/professor)
const profNsp = io.of('/professor');

// Autenticación ADMIN_KEY
profNsp.use((socket, next) => {
	const key = socket.handshake.auth?.key;
	if (key === process.env.ADMIN_KEY) return next();
	next(new Error('Not authorized'));
});

profNsp.on('connection', socket => {
	console.log('Profesor conectado');
	socket.on('startCompetition', ({ sessionId }) => {
		jocsNsp.to(sessionId).emit('game_started', { sessionId });
	});

	socket.on('endCompetition', ({ sessionId, results }) => {
		jocsNsp.to(sessionId).emit('game_ended', { sessionId, results });
	});
});

// Namespace de chat entre usuarios 
export const chatNsp = io.of('/chat');

chatNsp.use(async (socket, next) => {
	try {
		const token = socket.handshake.auth?.token;
		if (!token) throw new Error('No token');
		const payload = verifyToken(token);
		if (!payload) throw new Error('Invalid token');
		const user = await User.findById((payload as any).id);
		if (!user || user.isDeleted) throw new Error('Unauthorized');
		socket.data.userId = user._id.toString();
		next();
	} catch {
		next(new Error('Authentication error'));
	}
});

chatNsp.on('connection', socket => {
	const uid = socket.data.userId;
	socket.join(uid);  // cada usuario en su “room”
	console.log(` Usuario ${uid} conectado al chat`);
	socket.on('send_message', async ({ senderId, receiverId, content }) => {
		try {
			if (!senderId || !receiverId || !content) {
				console.warn('Faltan datos en send_message');
				return;
			}

			// Guardar el mensaje en MongoDB
			const newMsg = new Message({ senderId, receiverId, content });
			await newMsg.save();

			const messagePayload = {
				senderId,
				receiverId,
				content,
				timestamp: newMsg.createdAt,
			};

			// Emitir al receptor (si está conectado)
			chatNsp.to(receiverId).emit('new_message', messagePayload);

			// Emitir al remitente también (para confirmar envío)
			socket.emit('new_message', messagePayload);
		} catch (err) {
			console.error('Error al guardar o enviar mensaje:', err);
		}
	});
});

app.use(routeNotFound);

httpServer.listen(Number(LOCAL_PORT), '0.0.0.0', () => {
	console.log(`API y WS corriendo en puerto ${LOCAL_PORT}`);
});

