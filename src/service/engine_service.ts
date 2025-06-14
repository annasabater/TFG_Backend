// src/service/engine_service.ts
import axios from 'axios'; // NOTA: npm install axios

const ENGINE_URL = process.env.ENGINE_URL ?? 'http://localhost:8000';

/**
 * Estado posible de un participante en la sesión de juego.
 */
export type ParticipantStatus = 'ACCEPTED' | 'PENDING' | 'REJECTED';

/**
 * Participante de la sesión. 
 * user: aquí podrías poner un UserId (string) o un objeto user, según tu modelo.
 */
export interface Participant {
	status: ParticipantStatus;
	user: string;
}

/**
 * Sesión que recibe el motor para iniciar el juego.
 */
export interface Session {
	_id: string;
	scenario: string;
	mode: string;
	participants: Participant[];
}

/**
 * Comando genérico que se envía al motor.
 * Almarcarlo como Record<string, unknown> evitamos usar "any" y permite cualquier forma de objeto.
 */
export type EngineCommand = Record<string, unknown>;

/**
 * Lanza la partida en el motor remoto con sólo los participantes aceptados.
 */
export const startGameOnEngine = async (session: Session): Promise<void> => {
	// Filtramos sólo los ACCEPTED y extraemos su user
	const participants = session.participants
		.filter((p): p is Participant & { status: 'ACCEPTED' } => p.status === 'ACCEPTED')
		.map(p => p.user);

	await axios.post(`${ENGINE_URL}/start_game`, {
		sessionId: session._id,
		scenario: session.scenario,
		mode: session.mode,
		participants,
	});
};
/**
 * Envía un comando arbitrario al motor.
 */
export const sendCommandToEngine = async (cmd: EngineCommand): Promise<void> => {
	await axios.post(`${ENGINE_URL}/send_command`, cmd);
};
