import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { createAdminToken } from "@/lib/auth";

function hashPassword(password: string): string {
  const salt = "ramu_roastery_salt_2026";
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

// Anti-Brute-Force Rate Limiter (Max 5 failed attempts per 15 minutes)
const globalLoginAttempts = globalThis as unknown as {
  __adminLoginAttempts?: Map<string, { count: number; lockedUntil: number }>;
};
if (!globalLoginAttempts.__adminLoginAttempts) {
  globalLoginAttempts.__adminLoginAttempts = new Map();
}
const attemptsTracker = globalLoginAttempts.__adminLoginAttempts;

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "127.0.0.1";

    // 1. Check if IP is currently locked out
    const attemptRecord = attemptsTracker.get(clientIp);
    const now = Date.now();
    if (attemptRecord && attemptRecord.lockedUntil > now) {
      const remainingSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
      return NextResponse.json(
        { 
          success: false, 
          error: `Terlalu banyak percobaan gagal. Akses login terkunci selama ${Math.ceil(remainingSeconds / 60)} menit lagi demi keamanan.` 
        }, 
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 });
    }

    const envAdminUser = process.env.ADMIN_USERNAME || "admin";
    const envAdminPass = process.env.ADMIN_PASSWORD || "password123";

    let isValid = false;

    // 1. Check environment variable credentials
    if (username === envAdminUser && password === envAdminPass) {
      isValid = true;
    }

    // 2. Check database admin user if not matched
    if (!isValid) {
      try {
        const dbAdmin = await prisma.user.findFirst({
          where: {
            OR: [
              { email: username.toLowerCase().trim() },
              { name: username }
            ],
            role: "ADMIN"
          }
        });

        if (dbAdmin) {
          const inputHash = hashPassword(password);
          if (
            dbAdmin.passwordHash === inputHash ||
            dbAdmin.passwordHash === password ||
            (dbAdmin as any).password === password
          ) {
            isValid = true;
          }
        }
      } catch (dbErr) {
        console.warn("DB Admin lookup skipped or failed:", dbErr);
      }
    }

    if (!isValid) {
      // Record failed attempt
      const current = attemptsTracker.get(clientIp) || { count: 0, lockedUntil: 0 };
      current.count += 1;
      if (current.count >= 5) {
        current.lockedUntil = now + 15 * 60 * 1000; // Lock for 15 minutes
        attemptsTracker.set(clientIp, current);
        return NextResponse.json(
          { 
            success: false, 
            error: "Username atau Password salah. Batas percobaan terlampaui, akses dikunci selama 15 menit." 
          }, 
          { status: 429 }
        );
      }
      attemptsTracker.set(clientIp, current);

      return NextResponse.json(
        { 
          success: false, 
          error: `Username atau Password salah. (Sisa percobaan: ${5 - current.count})` 
        }, 
        { status: 401 }
      );
    }

    // Login successful — Reset failed attempts
    attemptsTracker.delete(clientIp);

    // Generate cryptographic HMAC-SHA256 session token
    const token = await createAdminToken(username);

    const response = NextResponse.json({ success: true, token });
    response.cookies.set("admin_token", token, {
      path: "/",
      httpOnly: true, // Secure: cannot be accessed or manipulated via client JavaScript
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax"
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
