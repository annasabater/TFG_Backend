import { Request, Response } from 'express';
import Conversation from '../models/conversation_models.js';

export const openConversationHandler = async (req: Request, res: Response) => {
  const { members } = req.body as { members: string[] };
  if (!Array.isArray(members) || members.length !== 2) {
    return res.status(400).json({ error: 'members debe ser [uid1, uid2]' });
  }
  try {
    let conv = await Conversation.findOne({ members: { $all: members } });
    if (!conv) conv = await Conversation.create({ members });
    res.status(conv.isNew ? 201 : 200).json(conv);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
};

export const getConversationsHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const convs = await Conversation.find({ members: userId })
      .sort({ updatedAt: -1 })
      .lean();
    res.json(convs);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
};
