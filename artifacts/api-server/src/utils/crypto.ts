import bcrypt from "bcryptjs";
import { randomBytes, createHmac } from "crypto";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_ROUNDS);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function generateSecureToken(bytesCount: number = 32): string {
  return randomBytes(bytesCount).toString("hex");
}

export function hashToken(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}
