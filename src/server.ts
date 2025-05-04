//src/server.ts
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
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
console.log(process.env.MONGODB_URI,process.env.SERVER_PORT,process.env.JWT_SECRET);
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
});