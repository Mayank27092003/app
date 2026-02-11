import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { StringValue } from "../types/jwt";

export function generateToken<T extends object>(
  payload: T,
  expiresIn?: StringValue
): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: expiresIn || "7d",
  });
}

export function verifyToken<T extends object>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET) as T;
}
