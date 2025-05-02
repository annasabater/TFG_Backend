//src/controllers/session_controller.ts
import { Request, Response } from 'express';
import {
  createSession,
  joinLobby,
  listPending,
  acceptPlayers
} from '../service/session_service.js';

//POST /api/sessions
export const createSessionHandler = async (req: any, res: Response) => {
  try {
    const { scenario, mode } = req.body;
    const sess = await createSession(req.user.id, scenario, mode);
    res.status(201).json(sess);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


//POST /api/sessions/:id/join
export const joinLobbyHandler = async (req: any, res: Response) => {
  try {
    const sess = await joinLobby(req.params.id, req.user.id);
    res.json(sess);
  } catch (err: any) {
    if (err.message === 'Sesión no existe') {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};


//GET /api/sessions/pending
export const listPendingHandler = async (req: any, res: Response) => {
  try {
    const pending = await listPending(req.user.id);
    res.json(pending);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

//POST /api/sessions/:id/accept
export const acceptPlayersHandler = async (req: any, res: Response) => {
  try {
    const { userIds } = req.body as { userIds: string[] };
    const sess = await acceptPlayers(req.params.id, userIds);
    res.json(sess);
  } catch (err: any) {
    if (err.message === 'Sesión no encontrada') {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};
