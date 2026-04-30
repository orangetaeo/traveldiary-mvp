/**
 * JWT 발급/검증 — 사이클 11b (ADR-026).
 *
 * jose RFC 7519 표준. Edge runtime 호환.
 * JWT_SECRET 미설정 시 모든 함수 null 반환 → 단일 사용자 모드 fallback.
 */

import { SignJWT, jwtVerify } from "jose";

const ISSUER = "traveldiary-mvp";
const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";

export type TokenType = "access" | "refresh";

export interface JwtPayload {
  sub: string;
  type: TokenType;
}

function getSecret(): Uint8Array | null {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) return null;
  return new TextEncoder().encode(s);
}

export const jwtAvailable = (): boolean => getSecret() !== null;

export async function signToken(
  sub: string,
  type: TokenType,
): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  try {
    return await new SignJWT({ type })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(ISSUER)
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(type === "access" ? ACCESS_TTL : REFRESH_TTL)
      .sign(secret);
  } catch (err) {
    console.error("[jwt] sign failed", err);
    return null;
  }
}

export async function verifyToken(
  token: string,
): Promise<JwtPayload | null> {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
    if (typeof payload.sub !== "string") return null;
    const t = (payload as { type?: unknown }).type;
    if (t !== "access" && t !== "refresh") return null;
    return { sub: payload.sub, type: t };
  } catch {
    return null;
  }
}
