// src/middleware/corsHandler.ts

import cors from 'cors';

const allowedOrigins = [
  'https://3684-85-49-132-44.ngrok-free.app',  // túnel Web (Flutter)
  'http://localhost:8080',                     // desplegament local
  'http://127.0.0.1:8080',                     // fallback local
];

export const corsHandler = cors({
  origin: (origin, callback) => {

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],
});

