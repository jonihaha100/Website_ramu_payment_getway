import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import crypto from 'crypto';
import { requireAdmin } from '../../../lib/auth';

function hashPassword(password: string): string {
  const salt = 'ramu_roastery_salt_2026';
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Sanitize user object to strictly exclude sensitive credentials like passwordHash
function sanitizeUser(user: any) {
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    // 1. Single user lookup (for user profile / cart / checkout)
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          _count: { select: { orders: true } },
          addresses: {
            orderBy: { isDefault: 'desc' },
            take: 1
          }
        }
      });

      if (user) {
        const addressObj = user.addresses?.[0];
        const formattedAddress = addressObj 
          ? `${addressObj.address}, ${addressObj.village || ''}, ${addressObj.subdistrict || ''}, ${addressObj.city}, ${addressObj.province} ${addressObj.postalCode}`
          : null;

        const safe = sanitizeUser(user);
        return NextResponse.json({
          ...safe,
          totalOrders: user._count.orders,
          address: formattedAddress,
          city: addressObj?.city || null
        });
      }
      return NextResponse.json(null);
    }
    
    // 2. All users listing: STRICTLY requires Admin Session to prevent data scraping
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true } },
        addresses: {
          orderBy: { isDefault: 'desc' },
          take: 1
        }
      }
    });

    const mappedUsers = users.map(user => {
      const addressObj = user.addresses?.[0];
      const formattedAddress = addressObj 
        ? `${addressObj.address}, ${addressObj.village || ''}, ${addressObj.subdistrict || ''}, ${addressObj.city}, ${addressObj.province} ${addressObj.postalCode}`
        : null;

      const safe = sanitizeUser(user);
      return {
        ...safe,
        totalOrders: user._count.orders,
        address: formattedAddress,
        city: addressObj?.city || null
      };
    });

    return NextResponse.json(mappedUsers);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const cleanEmail = body.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar. Silakan login.' }, { status: 400 });
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (body.password) {
      passwordHash = hashPassword(body.password);
    }

    // ANTI PRIVILEGE ESCALATION: Public registration is locked to role 'USER'
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: body.name || cleanEmail.split('@')[0],
        phone: body.phone || null,
        gender: body.gender || null,
        dob: body.dob || null,
        passwordHash: passwordHash || null,
        role: 'USER', // Always default to standard USER
      }
    });

    const { createUserToken } = await import('../../../lib/auth');
    const token = await createUserToken(newUser.email, 'customer');

    const response = NextResponse.json({ 
      success: true, 
      data: {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || '',
        gender: newUser.gender || '',
        dob: newUser.dob || '',
        role: 'customer',
        provider: 'local',
      }
    }, { status: 201 });

    response.cookies.set('user_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error("Failed to save user:", error);
    return NextResponse.json({ error: 'Gagal menyimpan data pengguna' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Changing user roles strictly requires Admin Authorization
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const allowedRoles = ['USER', 'B2B', 'ADMIN'];
    const targetRole = (body.role || 'USER').toUpperCase();
    if (!allowedRoles.includes(targetRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: body.id },
      data: {
        role: targetRole
      }
    });

    return NextResponse.json({ success: true, data: sanitizeUser(updatedUser) });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
