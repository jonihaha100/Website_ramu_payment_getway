import { NextRequest, NextResponse } from "next/server";

// SECURE IN-MEMORY EPHEMERAL SECRET IF ENV IS NOT CONFIGURED
// Never use a predictable hardcoded static fallback string!
const globalForAuth = globalThis as unknown as {
  __ephemeralSecret?: string;
};

function getSecretKeyString(): string {
  if (process.env.ADMIN_JWT_SECRET && process.env.ADMIN_JWT_SECRET.length >= 16) {
    return process.env.ADMIN_JWT_SECRET;
  }
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8) {
    return process.env.ADMIN_PASSWORD;
  }
  if (!globalForAuth.__ephemeralSecret) {
    // Generate a cryptographically secure 256-bit random string in memory
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    let randomHex = "";
    for (let i = 0; i < randomBytes.length; i++) {
      randomHex += randomBytes[i].toString(16).padStart(2, "0");
    }
    globalForAuth.__ephemeralSecret = randomHex;
    console.warn(
      "[SECURITY NOTICE] ADMIN_JWT_SECRET is not configured in .env. Generated a secure 256-bit ephemeral key in memory for this server session."
    );
  }
  return globalForAuth.__ephemeralSecret;
}

function strToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function uint8ToBase64Url(buf: Uint8Array): string {
  let binary = "";
  const len = buf.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUint8(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const keyData = strToUint8(getSecretKeyString()) as unknown as BufferSource;
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface AdminTokenPayload {
  username: string;
  role: "ADMIN";
  iat: number;
  exp: number;
}

export interface UserTokenPayload {
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function createAdminToken(username: string): Promise<string> {
  const payload: AdminTokenPayload = {
    username,
    role: "ADMIN",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = uint8ToBase64Url(strToUint8(payloadStr));

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    strToUint8(payloadBase64) as unknown as BufferSource
  );
  const signatureBase64 = uint8ToBase64Url(new Uint8Array(signatureBuffer));

  return `${payloadBase64}.${signatureBase64}`;
}

export async function createUserToken(email: string, role: string = "customer"): Promise<string> {
  const payload: UserTokenPayload = {
    email: email.toLowerCase().trim(),
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = uint8ToBase64Url(strToUint8(payloadStr));

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    strToUint8(payloadBase64) as unknown as BufferSource
  );
  const signatureBase64 = uint8ToBase64Url(new Uint8Array(signatureBuffer));

  return `${payloadBase64}.${signatureBase64}`;
}

export async function verifyAdminToken(token: string | undefined | null): Promise<{ valid: boolean; username?: string }> {
  if (!token || typeof token !== "string") return { valid: false };

  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };

  const [payloadBase64, signatureBase64] = parts;

  try {
    const key = await getCryptoKey();
    const signatureBytes = base64UrlToUint8(signatureBase64) as unknown as BufferSource;
    const dataBytes = strToUint8(payloadBase64) as unknown as BufferSource;

    const isValidSig = await crypto.subtle.verify("HMAC", key, signatureBytes, dataBytes);
    if (!isValidSig) return { valid: false };

    const payloadJson = new TextDecoder().decode(base64UrlToUint8(payloadBase64));
    const payload: AdminTokenPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false }; // Expired
    }

    if (payload.role !== "ADMIN") {
      return { valid: false };
    }

    return { valid: true, username: payload.username };
  } catch (_err) {
    return { valid: false };
  }
}

export async function verifyUserToken(token: string | undefined | null): Promise<{ valid: boolean; email?: string; role?: string }> {
  if (!token || typeof token !== "string") return { valid: false };

  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };

  const [payloadBase64, signatureBase64] = parts;

  try {
    const key = await getCryptoKey();
    const signatureBytes = base64UrlToUint8(signatureBase64) as unknown as BufferSource;
    const dataBytes = strToUint8(payloadBase64) as unknown as BufferSource;

    const isValidSig = await crypto.subtle.verify("HMAC", key, signatureBytes, dataBytes);
    if (!isValidSig) return { valid: false };

    const payloadJson = new TextDecoder().decode(base64UrlToUint8(payloadBase64));
    const payload: UserTokenPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false }; // Expired
    }

    if (!payload.email) {
      return { valid: false };
    }

    return { valid: true, email: payload.email, role: payload.role };
  } catch (_err) {
    return { valid: false };
  }
}

export async function requireAdmin(req: Request | NextRequest): Promise<NextResponse | null> {
  let token: string | null = null;

  // 1. Check cookies if req has cookies object
  if ("cookies" in req && typeof (req as any).cookies?.get === "function") {
    token = (req as any).cookies.get("admin_token")?.value || null;
  } else {
    // Parse cookie header manually
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  // 2. Fallback to Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  const { valid } = await verifyAdminToken(token);
  if (!valid) {
    return NextResponse.json(
      { error: "Unauthorized: Akses ditolak. Diperlukan sesi Administrator yang sah." },
      { status: 401 }
    );
  }

  return null;
}

export async function getUserSession(req: Request | NextRequest): Promise<{ email: string; role: string } | null> {
  let token: string | null = null;

  if ("cookies" in req && typeof (req as any).cookies?.get === "function") {
    token = (req as any).cookies.get("user_session")?.value || null;
  } else {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)user_session=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  const { valid, email, role } = await verifyUserToken(token);
  if (!valid || !email) return null;

  return { email, role: role || "customer" };
}

