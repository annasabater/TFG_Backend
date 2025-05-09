//src/models/drone_models.ts
import mongoose from "mongoose";

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
    ratings  : [ratingSchema]
  });
  

export interface IRating {
    userId: string;
    rating: number;
    comment: string;
}

// Modelos
const Drone = mongoose.model('Drone', droneSchema);

export default Drone;

