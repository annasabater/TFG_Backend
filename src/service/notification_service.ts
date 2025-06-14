// src/service/notification_service.ts

import { Notification } from '../models/notification_model.js';

export const pushNotification = async (p: {
  to: string;
  from: string;
  type: 'like' | 'comment' | 'follow' | 'new_post';
  post?: string;
}) => {
	if (p.to === p.from) return;          // no ens notifiquem a nosaltres mateixos
	await Notification.create(p);
};
