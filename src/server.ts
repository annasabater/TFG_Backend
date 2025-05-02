//src/server.ts
/*import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/user_routes.js'; // Nota el .js al final
import forumRoutes from './routes/forum_routes.js'; // Nota el .js al final
import droneRoutes from './routes/drone_routes.js'; // Nota el .js al final
import gameRoutes from './routes/game_routes.js';
import sessionRoutes from './routes/session_routes.js';
//import messageRoutes from './routes/message_routes.js'
import { corsHandler } from './middleware/corsHandler.js';
import { loggingHandler } from './middleware/loggingHandler.js';
import { routeNotFound } from './middleware/routeNotFound.js';
import { validateUserFields } from './middleware/userValidationSignIn.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

dotenv.config(); // Cargamos las variables de entorno desde el archivo .env

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
                name: 'Sesión', 
                description: 'Sesión de juego' ,
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
app.use(loggingHandler);
app.use(corsHandler);
//rutas
app.use('/api', userRoutes);
//app.use('/api',messageRoutes);
app.use('/api', forumRoutes);
app.use('/api', droneRoutes);
app.use('/api', gameRoutes);
app.use('/api', sessionRoutes);

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
});
*/
// src/server.ts

import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import userRoutes from './routes/user_routes.js';
import forumRoutes from './routes/forum_routes.js';
import droneRoutes from './routes/drone_routes.js';
import gameRoutes from './routes/game_routes.js';
import sessionRoutes from './routes/session_routes.js';

import { corsHandler } from './middleware/corsHandler.js';
import { loggingHandler } from './middleware/loggingHandler.js';
import { routeNotFound } from './middleware/routeNotFound.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

import { joinLobby, listPending, acceptPlayers } from './service/session_service.js';
import { startGameOnEngine, sendCommandToEngine } from './service/engine_service.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: '*' } });

const PORT = process.env.SERVER_PORT || 9000;

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de la Plataforma',
      version: '1.0.0',
      description: 'Documentación de la API'
    },
    servers: [{ url: `http://localhost:${PORT}` }]
  },
  apis: ['./routes/*.js']
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(swaggerOptions)));

// Middlewares
app.use(express.json());
app.use(loggingHandler);
app.use(corsHandler);

// REST routes
app.use('/api', userRoutes);
app.use('/api', forumRoutes);
app.use('/api', droneRoutes);
app.use('/api', gameRoutes);
app.use('/api', sessionRoutes);

// 404 handler
app.use(routeNotFound);

// Healthcheck
app.get('/', (_req, res) => res.send('Welcome to my API'));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ExampleDatabase')
  .then(() => console.log('Connected to DB'))
  .catch(err => console.error('DB Connection Error:', err));

// Socket.IO: Lobby namespace
const lobbyNS = io.of('/lobby');
lobbyNS.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token provided'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.user = decoded;
    next();
  } catch (error: any) {
    next(new Error(error.message || 'Invalid token'));
  }
});

lobbyNS.on('connection', socket => {
  const userId = String(socket.data.user.id);
  socket.join(userId);

  socket.on('join_lobby', async ({ sessionId }) => {
    try {
      await joinLobby(sessionId, userId);
      const pending = await listPending(userId);
      lobbyNS.to(userId).emit('lobby_update', { sessionId, participants: pending });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('select_players', async ({ sessionId, userIds }) => {
    try {
      const sess = await acceptPlayers(sessionId, userIds);
      userIds.forEach((pid: string) => {
        lobbyNS.to(pid).emit('game_start', {
          sessionId: sess._id,
          scenario: sess.scenario,
          mode: sess.mode
        });
      });
      await startGameOnEngine(sess);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });
});

// Socket.IO: Game namespace
const gameNS = io.of('/game');
gameNS.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token provided'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.user = decoded;
    next();
  } catch (error: any) {
    next(new Error(error.message || 'Invalid token'));
  }
});

gameNS.on('connection', socket => {
  socket.on('command', async (cmd: any) => {
    try {
      await sendCommandToEngine(cmd);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
