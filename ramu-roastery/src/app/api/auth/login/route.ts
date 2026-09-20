import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = 'ramu_roastery_salt_2026'; // Fixed salt for simplicity
  return crypto.scryptSync(password, salt, 64).toString('hex');
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

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak terdaftar. Silakan daftar terlebih dahulu.' },
        { status: 401 }
      );
    }

    // Check if user has a password hash (some users might not if registered before this feature)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Akun ini belum memiliki password. Silakan hubungi admin.' },
        { status: 401 }
      );
    }

    // Compare password
    const inputHash = hashPassword(password);
    if (inputHash !== user.passwordHash) {
      return NextResponse.json(
        { error: 'Password yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    // Login successful — return user data (never return passwordHash!)
    return NextResponse.json({
      success: true,
      data: {
        name: user.name || 'User',
        email: user.email,
        phone: user.phone || '',
        gender: user.gender || '',
        dob: user.dob || '',
        role: user.role?.toLowerCase() === 'admin' ? 'admin' 
            : user.role?.toLowerCase() === 'b2b' ? 'b2b' 
            : 'customer',
        provider: 'local',
        avatarUrl: user.avatarUrl || '',
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
