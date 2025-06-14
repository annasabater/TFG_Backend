//src/models/drone_models.ts
import mongoose from "mongoose";
import { IRating } from "./message_models.js";

const ratingSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	rating: { type: Number, min: 1, max: 5, required: true },
	comment: { type: String, required: true }
});

export interface IDrone {
    ownerId: string;
    model: string;
    price: number;
    details?: string;
    category: 'venta' | 'alquiler';
    condition: 'nuevo' | 'usado';
    location: string;
    contact?: string;
    images?: string[];
    status?: 'actiu' | 'venut';        
    createdAt?: Date;
    ratings?: IRating[];
    currency: 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | 'CNY' | 'HKD' | 'NZD';
    buyerId?: string;
    stock?: number; // <--- Añadido para compras múltiples
  }
  

const droneSchema = new mongoose.Schema({
	ownerId  : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	model    : { type: String, required: true },
	price    : { type: Number, required: true },
	details  : { type: String },
	category : { type: String, enum: ['venta', 'alquiler'], required: true },
	condition: { type: String, enum: ['nuevo', 'usado'], required: true },
	location : { type: String, required: true },
	contact  : { type: String },
	images   : [{ type: String }],
	createdAt: { type: Date, default: Date.now },
	status   : { type: String, enum: ['actiu', 'venut'], default: 'actiu' },
	ratings  : [ratingSchema],
	currency : { type: String, enum: ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'HKD', 'NZD'], required: true, default: 'EUR' },
	buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	stock: { type: Number, default: 1, min: 0 } // <--- Añadido para compras múltiples
});

// Definir el virtual después de crear el schema

droneSchema.virtual('averageRating').get(function (this: any) {
	if (!this.ratings || this.ratings.length === 0) return null;
	const ratings = this.ratings.map((r: any) => r.rating).filter((r: any) => typeof r === 'number');
	if (ratings.length === 0) return null;
	return ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
});

// Modelos
const Drone = mongoose.model('Drone', droneSchema);

export default Drone;

