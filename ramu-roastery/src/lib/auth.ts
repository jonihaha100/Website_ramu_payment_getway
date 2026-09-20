import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY_STRING = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD || "ramu_roastery_secret_jwt_key_2026_secure";

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
  const keyData = strToUint8(SECRET_KEY_STRING) as unknown as BufferSource;
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
