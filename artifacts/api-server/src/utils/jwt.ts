import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./app-error";
import { randomUUID } from "crypto";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  systemRole: string;
  tenantId: string;
  jti?: string;
}

/**
 * Signs a new JWT Access Token
 * @param payload JWT claims payload
 * @returns signed token string
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
}

/**
 * Signs a new JWT Refresh Token
 * @param payload JWT claims payload
 * @returns signed token string
 */
export function signRefreshToken(payload: JwtPayload): string {
  const jti = randomUUID();
  return jwt.sign({ ...payload, jti }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies and decodes a JWT Access Token
 * @param token access token string
 * @returns verified JWT claims payload
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (err) {
    throw AppError.unauthorized("Invalid or expired access token", "INVALID_ACCESS_TOKEN");
  }
}

/**
 * Verifies and decodes a JWT Refresh Token
 * @param token refresh token string
 * @returns verified JWT claims payload
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (err) {
    throw AppError.unauthorized("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
  }
}

/**
 * Decodes a JWT Token without verification checks
 * @param token token string
 * @returns decoded payload or null
 */
export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null;
}
