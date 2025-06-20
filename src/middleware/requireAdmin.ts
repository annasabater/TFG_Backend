// src/middleware/requireAdmin.ts

import { Request, Response, NextFunction } from "express";
import User from "../models/user_models.js";
import { JwtPayload } from "jsonwebtoken";

interface ReqExt extends Request {
  user?: string | JwtPayload;
}

export const requireAdmin = async (req: ReqExt, res: Response, next: NextFunction) => {
  try {
    const payload = req.user as JwtPayload | undefined;
    if (!payload?.id) return res.status(401).json({ message: "UNAUTHENTICATED" });

    const user = await User.findById(payload.id, "role isDeleted");
    if (!user || user.isDeleted) return res.status(401).json({ message: "UNAUTHENTICATED" });

    const isAdmin = ["Administrador", "Gobierno"].includes(user.role);
    if (!isAdmin) return res.status(403).json({ message: "ADMIN_ONLY" });

    next();
  } catch (err) {
    next(err);
  }
};
