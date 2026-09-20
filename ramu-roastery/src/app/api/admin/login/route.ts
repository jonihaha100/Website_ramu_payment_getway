import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { createAdminToken } from "@/lib/auth";

function hashPassword(password: string): string {
  const salt = "ramu_roastery_salt_2026";
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ success: false, error: "Username atau Password salah." }, { status: 401 });
    }

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
