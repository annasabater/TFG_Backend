// src/middleware/corsHandler.ts
import cors from 'cors';

const allowedOrigins = [
  'https://1ba9-85-49-132-44.ngrok-free.app', // túnel WEB (8080)
  'http://localhost:8080',                    //  en local
];

export const corsHandler = cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
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
