// src/server.ts
import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import userRoutes from './routes/user_routes.js';
import forumRoutes from './routes/forum_routes.js';
import droneRoutes from './routes/drone_routes.js';
import gameRoutes from './routes/game_routes.js';
import authRoutes from './routes/auth_routes.js';
import messageRoutes from './routes/message_routes.js';
import sessionRoutes from './routes/session_routes.js';
import { corsHandler } from './middleware/corsHandler.js';
import { loggingHandler } from './middleware/loggingHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { verifyToken } from './utils/jwtHandler.js';
import User from './models/user_models.js';
import { routeNotFound } from './middleware/routeNotFound.js';
import { Session } from './models/session_models.js';
import { sendMessage } from './service/message_service.js';

// Carga variables de entorno
dotenv.config({ path: '../.env' });

// Crear app de Express
const app = express();
const LOCAL_PORT = process.env.SERVER_PORT || 9000;

// Configuración de Swagger
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
              name: 'Auth', 
              description: 'Registro y Login de usuarios' ,
          },
          { 
              name: 'Favourites', 
              description: 'Productes marcats com a favorits' ,
          },
          { 
              name: 'Orders', 
              description: 'Pedidos de compra' ,
          }
        ],
      servers: [
          {
              url: `http://localhost:${LOCAL_PORT}`
          }
      ]
  },
  apis: ['./routes/*.js'] 
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
app.use('/api', gameRoutes);
app.use('/api', sessionRoutes);
app.use('/api', authRoutes);
app.use('/api', messageRoutes);

// Ruta de prueba
app.get('/', (_req, res) => {
  res.send('Welcome to my API');
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ExampleDatabase')
  .then(() => console.log('Connected to DB'))
  .catch(err => console.error('DB Connection Error:', err));

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// — Namespace de jugadores `/jocs` —
const jocsNsp = io.of('/jocs');
const competitors = new Set([
  'dron_azul1@upc.edu',
  'dron_verde1@upc.edu',
  'dron_rojo1@upc.edu',
  'dron_amarillo1@upc.edu',
]);

// Autenticación de drones
jocsNsp.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error('No token');
    const payload = verifyToken(token);
    if (!payload) throw new Error('Invalid token');
    const user = await User.findById((payload as any).id);
    if (!user || user.isDeleted || !competitors.has(user.email)) {
      throw new Error('Unauthorized');
    }
    socket.data.userEmail = user.email;    // guardamos el email
    socket.data.userId    = user._id.toString();
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

// Al conectar cada dron
jocsNsp.on('connection', socket => {
  console.log(`→ Drone ${socket.data.userEmail} (${socket.data.userId}) connected to /jocs`);

  // Se une a la sala de juego
  socket.on('join', ({ sessionId }) => {
    socket.join(sessionId);
    const count = jocsNsp.adapter.rooms.get(sessionId)?.size ?? 0;
    jocsNsp.to(sessionId).emit('waiting', { msg: `Esperando jugadores: ${count}` });
  });

  // Control desde el dron: reenviamos estado a los demás drones y forward a profesor
  socket.on('control', data => {
    const { sessionId, action, payload } = data;
    // 1) a los demás drones en la sala
    socket.to(sessionId).emit('state_update', { action, payload, by: socket.data.userEmail });
    // 2) al profesor
    profNsp.to(sessionId).emit('control', data);
  });

  // Profesor puede iniciar partida directamente en este namespace
  socket.on('start_game_from_professor', ({ sessionId }) => {
    console.log(`[jocs] start_game_from_professor for session ${sessionId}`);
    jocsNsp.to(sessionId).emit('game_started', { sessionId });
  });
});


// — Namespace del profesor `/professor` —
const profNsp = io.of('/professor');

// Auth middleware para profesor
profNsp.use((socket, next) => {
  const key = socket.handshake.auth?.key;
  if (key === process.env.ADMIN_KEY) return next();
  next(new Error('Not authorized'));
});

profNsp.on('connection', socket => {
  socket.on('startCompetition', async ({ sessionId }) => {
    socket.join(sessionId);
    // 1) persisto en BD (si no está creado aún)
    //   — OJO: asegúrate antes de haber hecho POST /api/sessions
    // 2) leo el escenario guardado
    const doc = await Session.findById(sessionId).select('scenario mode').lean();
    if (!doc) {
      console.error('Sesión no encontrada al iniciar competition', sessionId);
      return;
    }
    // 3) emito a los drones
    jocsNsp.to(sessionId).emit('scenario', doc.scenario);
    // 4) arranco la partida
    jocsNsp.to(sessionId).emit('game_started', { sessionId });
  });
});



export const chatNsp = io.of('/chat');

chatNsp.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error('No token');
    const payload = verifyToken(token);
    if (!payload || !(payload as any).id) throw new Error('Invalid token');
    const user = await User.findById((payload as any).id);
    if (!user || user.isDeleted) throw new Error('Unauthorized');
    socket.data.userId = user._id.toString();        // <-- guardamos string
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

// 2) Al conectar un cliente
chatNsp.on('connection', socket => {
  const uid = socket.data.userId as string;
  socket.join(uid);
  console.log(`→ Usuario ${uid} conectado al chat`);

  // 3) Listener de envío de mensaje
  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, content } = data;
      // Guarda en BBDD
      const msg = await sendMessage(senderId, receiverId, content);

      // Prepara payload con IDs string
      const payload = msg.toObject();
      payload.senderId   = payload.senderId.toString();
      payload.receiverId = payload.receiverId.toString();

      // Emite a rooms correctos
      chatNsp.to(payload.receiverId).emit('new_message', payload);
      chatNsp.to(payload.senderId).emit('new_message', payload);
    } catch (err) {
      console.error('Error en send_message WS:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`← Usuario ${uid} desconectado del chat`);
  });
});

httpServer.listen(LOCAL_PORT, () => {
  console.log(`API y WS corriendo en puerto ${LOCAL_PORT}`);
});



/*//src/server.ts
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user_routes.js'; // Nota el .js al final
import forumRoutes from './routes/forum_routes.js'; // Nota el .js al final
import droneRoutes from './routes/drone_routes.js'; // Nota el .js al final
import gameRoutes from './routes/game_routes.js';
import authRoutes from './routes/auth_routes.js';
import sessionRoutes from './routes/session_routes.js'; // Nota el .js al final
//import messageRoutes from './routes/message_routes.js'
import { corsHandler } from './middleware/corsHandler.js';
import { loggingHandler } from './middleware/loggingHandler.js';
import { routeNotFound } from './middleware/routeNotFound.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

dotenv.config({ path: '../.env' });// Cargamos las variables de entorno desde el archivo .env

const app = express();
const LOCAL_PORT = process.env.SERVER_PORT || 9000;

// Configuración de Swagger
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
                name: 'Auth', 
                description: 'Registro y Login de usuarios' ,
            }
          ],
        servers: [
            {
                url: `http://localhost:${LOCAL_PORT}`
            }
        ]
    },
    apis: ['./routes/*.js'] // Asegúrate de que esta ruta apunta a tus rutas
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Middleware
app.use(express.json());
app.use(cookieParser())
app.use(loggingHandler);
app.use(corsHandler);
//rutas
app.use('/api', userRoutes);
//app.use('/api',messageRoutes);
app.use('/api', forumRoutes);
app.use('/api', droneRoutes);
app.use('/api', gameRoutes);
app.use('/api', sessionRoutes);

app.use('/api', authRoutes); // Middleware de autenticación para todas las rutas
// Rutes de prova
app.get('/', (req, res) => {
    res.send('Welcome to my API');
});

// Conexión a MongoDB
//mongoose;
mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ExampleDatabase')
    .then(() => console.log('Connected to DB'))
    .catch((error) => console.error('DB Connection Error:', error));

// Iniciar el servidor
app.listen(LOCAL_PORT, () => {
    console.log('Server listening on port: ' + LOCAL_PORT);
    console.log(`Swagger disponible a http://localhost:${LOCAL_PORT}/api-docs`);
});*/