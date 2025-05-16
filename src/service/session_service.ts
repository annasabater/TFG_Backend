// src/service/session_service.ts
import mongoose from 'mongoose';
import { Session } from '../models/session_models.js';
import User from '../models/user_models.js';

// Valida que el usuario existe y no está eliminado
const validateUserNotDeleted = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new Error('Usuario no encontrado o eliminado');
  }
};

// Crea una nueva sesión (lobby)
export const createSession = async (hostId: string, scenario: any[], mode: string) => {
  await validateUserNotDeleted(hostId);
  const sess = new Session({ host: hostId, scenario, mode });
  return sess.save();
};

// Un jugador se une al lobby
export const joinLobby = async (sessionId: string, userId: string) => {
  await validateUserNotDeleted(userId);
  const sess = await Session.findById(sessionId);
  if (!sess) throw new Error('Sesión no existe');
  if (sess.participants.some(p => p.user.toString() === userId)) {
    return sess;
  }
  sess.participants.push({ user: new mongoose.Types.ObjectId(userId), status: 'PENDING' });
  return sess.save();
};

// Lista sesiones WAITING con participantes PENDING para un host
export const listPending = async (hostId: string) => {
  return Session.find({ host: hostId, state: 'WAITING' })
    .populate('participants.user', 'userName email')
    .lean();
};

// El host acepta jugadores y arranca la partida
export const acceptPlayers = async (sessionId: string, userIds: string[]) => {
  const sess = await Session.findById(sessionId);
  if (!sess) throw new Error('Sesión no encontrada');
  sess.participants.forEach(p => {
    if (userIds.includes(p.user.toString())) {
      p.status = 'ACCEPTED';
    }
  });
  sess.state = 'RUNNING';
  return sess.save();
};

// Obtiene el escenario, acepta rawId = ObjectId o entero como índice (1 → primer documento)
export const getScenario = async (rawId: string) => {
  let doc: any = null;

  if (mongoose.isValidObjectId(rawId)) {
    // Si es un ObjectId válido, buscar por _id
    doc = await Session.findById(rawId).select('scenario').lean();
  } else if (!isNaN(Number(rawId))) {
    // Si es numérico, lo tratamos como índice 1-based
    const idx = Math.max(0, Number(rawId) - 1);
    const arr = await Session.find()
      .skip(idx)
      .limit(1)
      .select('scenario')
      .lean();
    doc = arr[0] || null;
  } else {
    throw new Error('ID de sesión inválido');
  }

  return doc;
};
