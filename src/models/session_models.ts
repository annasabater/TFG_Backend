
// src/models/session_models.ts

import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	status: { type: String, enum: ['PENDING','ACCEPTED'], default: 'PENDING' }
});

const sessionSchema = new mongoose.Schema({
	scenario: { type: Array, required: true },      
	mode:     { type: String, required: true },      
	host:     { type: mongoose.Types.ObjectId, ref: 'User', required: true },
	participants: [participantSchema],
	state:    { type: String, enum: ['WAITING','RUNNING','ENDED'], default: 'WAITING' },
	createdAt:{ type: Date, default: Date.now }
});

export interface IParticipant { user: mongoose.Types.ObjectId; status: string; }
export interface ISession {
  scenario: string;
  mode: string;
  host: mongoose.Types.ObjectId;
  participants: IParticipant[];
  state: string;
}

export const Session = mongoose.model('Session', sessionSchema);

