//src/service/engine_service.ts
import axios from 'axios'; //NOTA: npm install axios

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:8000';

export const startGameOnEngine = async (session: any) => {
	await axios.post(`${ENGINE_URL}/start_game`, {
		sessionId: session._id,
		scenario: session.scenario,
		mode: session.mode,
		participants: session.participants
			.filter((p: any) => p.status === 'ACCEPTED')
			.map((p: any) => p.user)
	});
};

export const sendCommandToEngine = async (cmd: any) => {
	await axios.post(`${ENGINE_URL}/send_command`, cmd);
};