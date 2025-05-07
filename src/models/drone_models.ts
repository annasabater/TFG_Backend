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
    category?: 'venta' | 'alquiler';
    condition?: 'nuevo' | 'usado';
    location?: string;
    contact?: string;
    createdAt?: Date;
    ratings?: IRating[];
    images?: string[];
}

const droneSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    model: { type: String, required: true },
    price: { type: Number, required: true },
    details: { type: String, required: false },
    category: { type: String, enum: ['venta', 'alquiler'], required: false },
    condition: { type: String, enum: ['nuevo', 'usado'], required: false },
    location: { type: String, required: false },
    contact: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    ratings: [ratingSchema],
    images: [{ type: String }]
});

export interface IRating {
    userId: string;
    rating: number;
    comment: string;
}

// Modelos
const Drone = mongoose.model('Drone', droneSchema);

export default Drone;

