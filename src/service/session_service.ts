// src/service/session_service.ts
import mongoose from 'mongoose';
import { Session } from '../models/session_models.js';
import User from '../models/user_models.js';

// Add user validation to ensure the user is not deleted
const validateUserNotDeleted = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new Error('Usuario no encontrado o eliminado');
  }
};

//Crea una nueva sesión (lobby)
export const createSession = async (hostId: string, scenario: string, mode: string) => {
  await validateUserNotDeleted(hostId);
  const sess = new Session({ host: hostId, scenario, mode });
  return sess.save();
};

//Un jugador pide unirse al lobby
export const joinLobby = async (sessionId: string, userId: string) => {
  await validateUserNotDeleted(userId);
  const sess = await Session.findById(sessionId);
  if (!sess) throw new Error('Sesión no existe');
  // Evitar duplicados
  if (sess.participants.some(p => p.user.toString() === userId)) {
    return sess;
  }
  // Empujar nuevo participante
  sess.participants.push({ user: new mongoose.Types.ObjectId(userId), status: 'PENDING' });
  return sess.save();
};

//Listar sesiones WAITING con participantes PENDING para un host
export const listPending = async (hostId: string) => {
  return Session.find({ host: hostId, state: 'WAITING' })
    .populate('participants.user', 'userName email')
    .lean();
};

//El host acepta jugadores y arranca la partida
export const acceptPlayers = async (sessionId: string, userIds: string[]) => {
  const sess = await Session.findById(sessionId);
  if (!sess) throw new Error('Sesión no encontrada');
  // Actualizar estado de participantes aceptados
  sess.participants.forEach(p => {
    if (userIds.includes(p.user.toString())) {
      p.status = 'ACCEPTED';
    }
  });
  sess.state = 'RUNNING';
  return sess.save();
};
