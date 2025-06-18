// src/models/conversation_models.js

import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const conversationSchema = new Schema(
  {
    members: [
      {
        type: Types.ObjectId,
        ref: 'User',
        required: true,
      }
    ],
    lastMessage: {
      type: Types.ObjectId,
      ref: 'Message',
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Índice para buscar conversaciones entre dos miembros sin importar el orden
conversationSchema.index({ members: 1 });

export default model('Conversation', conversationSchema);
