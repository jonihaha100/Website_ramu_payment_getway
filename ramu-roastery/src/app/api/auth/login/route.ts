import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function hashPassword(password: string): string {
  const salt = 'ramu_roastery_salt_2026'; // Fixed salt for simplicity
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getStoredUsers(): any[] {
  try {
    const dbPath = path.join(process.cwd(), 'src/data/db.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      return data.users || [];
    }
  } catch (_e) {}
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    let user: any = null;

    try {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });
    } catch (dbErr) {
      console.warn("Notice: Prisma user lookup deferred, checking db.json:", dbErr instanceof Error ? dbErr.message : dbErr);
    }

    if (!user) {
      const storedUsers = getStoredUsers();
      const localUser = storedUsers.find((u: any) => (u.email || '').toLowerCase() === cleanEmail);
      if (localUser) {
        const inputHash = hashPassword(password);
        const matches = (localUser.passwordHash && localUser.passwordHash === inputHash) ||
                        (localUser.password && localUser.password === password);
        if (!matches) {
          return NextResponse.json(
            { error: 'Password yang Anda masukkan salah.' },
            { status: 401 }
          );
        }

        user = {
          id: localUser.id,
          name: localUser.name,
          email: localUser.email,
          phone: localUser.phone || '',
          gender: localUser.gender || '',
          dob: localUser.dob || '',
          role: localUser.role || 'USER',
          avatarUrl: localUser.avatarUrl || ''
        };
      }
    } else {
      // User found in Prisma
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: 'Akun ini belum memiliki password. Silakan hubungi admin.' },
          { status: 401 }
        );
      }
      const inputHash = hashPassword(password);
      if (inputHash !== user.passwordHash) {
        return NextResponse.json(
          { error: 'Password yang Anda masukkan salah.' },
          { status: 401 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak terdaftar. Silakan daftar terlebih dahulu.' },
        { status: 401 }
      );
    }

    // Login successful: return user data and issue signed httpOnly user_session cookie
    const userRole = user.role?.toLowerCase() === 'admin' ? 'admin' 
        : user.role?.toLowerCase() === 'b2b' ? 'b2b' 
        : 'customer';

    const { createUserToken } = await import('../../../../lib/auth');
    const token = await createUserToken(user.email, userRole);

    const response = NextResponse.json({
      success: true,
      data: {
        name: user.name || 'User',
        email: user.email,
        phone: user.phone || '',
        gender: user.gender || '',
        dob: user.dob || '',
        role: userRole,
        provider: 'local',
        avatarUrl: user.avatarUrl || '',
      }
    });

    response.cookies.set('user_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
