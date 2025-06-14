//src/controllers/session_controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Session } from '../models/session_models.js';
import {
	createSession,
	joinLobby,
	listPending,
	acceptPlayers,
	getScenario
} from '../service/session_service.js';


//POST /api/sessions
export const createSessionHandler = async (req: any, res: Response) => {
	try {
		// obtenemos del body un array de escenarios
		const scenario = req.body.scenario as any[];  
		const mode     = req.body.mode     as string;

		// validamos que venga un array no vacío
		if (!Array.isArray(scenario) || scenario.length === 0) {
			return res.status(400).json({ message: 'scenario debe ser un array no vacío' });
		}

		// creamos la sesión
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
	} catch (err: unknown) {
		if (err instanceof Error) {
			if (err.message === 'Sesión no existe') {
				return res.status(404).json({ message: err.message });
			}
			res.status(500).json({ message: err.message });
		} else {
			res.status(500).json({ message: String(err) });
		}
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
	} catch (err: unknown) {
		if (err instanceof Error) {
			if (err.message === 'Sesión no encontrada') {
				return res.status(404).json({ message: err.message });
			}
			res.status(500).json({ message: err.message });
		} else {
			res.status(500).json({ message: String(err) });
		}
	}
};

//GET /api/sessions/:id/scenario

export const getScenarioHandler = async (req: any, res: Response) => {
	const doc = await getScenario(req.params.id);
	if (!doc) return res.status(404).json({ message: 'Sesión no encontrada' });
	return res.json({ scenario: doc.scenario });
};

