import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import crypto from 'crypto';
import { requireAdmin, getUserSession } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';

function hashPassword(password: string): string {
  const salt = 'ramu_roastery_salt_2026';
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Sanitize user object to strictly exclude sensitive credentials like passwordHash & password
function sanitizeUser(user: any) {
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, password, confirmPassword, ...safeUser } = user;
  return safeUser;
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

function saveStoredUser(newUser: any) {
  try {
    const dbPath = path.join(process.cwd(), 'src/data/db.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (!data.users) data.users = [];
      data.users.push(newUser);
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (err) {
    console.error("Failed to save user to db.json:", err);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    // 1. Single user lookup (for user profile / cart / checkout)
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const adminCheck = await requireAdmin(request);
      const isAdmin = !adminCheck;
      const session = await getUserSession(request);
      const isOwner = session && session.email.toLowerCase() === cleanEmail;

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: 'Unauthorized: Akses data pribadi dibatasi. Silakan login terlebih dahulu.' },
          { status: 401 }
        );
      }

      let user: any = null;
      try {
        user = await prisma.user.findUnique({
          where: { email: cleanEmail },
          include: {
            _count: { select: { orders: true } },
            addresses: {
              orderBy: { isDefault: 'desc' },
              take: 1
            }
          }
        });
      } catch (dbErr) {
        console.warn("Notice: Prisma single user lookup deferred, checking db.json:", dbErr instanceof Error ? dbErr.message : dbErr);
      }

      if (user) {
        const addressObj = user.addresses?.[0];
        const formattedAddress = addressObj 
          ? `${addressObj.address}, ${addressObj.village || ''}, ${addressObj.subdistrict || ''}, ${addressObj.city}, ${addressObj.province} ${addressObj.postalCode}`
          : null;

        const safe = sanitizeUser(user);
        return NextResponse.json({
          ...safe,
          totalOrders: user._count?.orders ?? 0,
          address: formattedAddress,
          city: addressObj?.city || null
        });
      }

      // Check fallback db.json
      const stored = getStoredUsers();
      const localUser = stored.find((u: any) => (u.email || '').toLowerCase() === cleanEmail);
      if (localUser) {
        return NextResponse.json(sanitizeUser(localUser));
      }

      return NextResponse.json(null);
    }
    
    // 2. All users listing: STRICTLY requires Admin Session to prevent data scraping
    const authError = await requireAdmin(request);
    if (authError) return authError;

    let users: any[] = [];
    let fetchedFromPrisma = false;
    try {
      users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { orders: true } },
          addresses: {
            orderBy: { isDefault: 'desc' },
            take: 1
          }
        }
      });
      fetchedFromPrisma = true;
    } catch (dbErr) {
      console.warn("Notice: Prisma user list deferred, checking db.json:", dbErr instanceof Error ? dbErr.message : dbErr);
    }

    if (fetchedFromPrisma) {
      const mappedUsers = users.map(user => {
        const addressObj = user.addresses?.[0];
        const formattedAddress = addressObj 
          ? `${addressObj.address}, ${addressObj.village || ''}, ${addressObj.subdistrict || ''}, ${addressObj.city}, ${addressObj.province} ${addressObj.postalCode}`
          : null;

        const safe = sanitizeUser(user);
        return {
          ...safe,
          totalOrders: user._count?.orders ?? 0,
          address: formattedAddress,
          city: addressObj?.city || null
        };
      });

      return NextResponse.json(mappedUsers);
    }

    const storedUsers = getStoredUsers();
    return NextResponse.json(storedUsers.map(u => sanitizeUser(u)));
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

    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });
    } catch (_dbErr) {}

    if (!existingUser) {
      const storedUsers = getStoredUsers();
      existingUser = storedUsers.find((u: any) => (u.email || '').toLowerCase() === cleanEmail);
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar. Silakan login.' }, { status: 400 });
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (body.password) {
      passwordHash = hashPassword(body.password);
    }

    // ANTI PRIVILEGE ESCALATION: Public registration is locked to role 'USER'
    const newUserData = {
      id: `USR-${Date.now()}`,
      email: cleanEmail,
      name: body.name || cleanEmail.split('@')[0],
      phone: body.phone || null,
      gender: body.gender || null,
      dob: body.dob || null,
      passwordHash: passwordHash || null,
      role: 'USER', // Always default to standard USER
      status: 'Active',
      joinedDate: new Date().toISOString()
    };

    saveStoredUser(newUserData);

    try {
      await prisma.user.create({
        data: {
          email: newUserData.email,
          name: newUserData.name,
          phone: newUserData.phone,
          gender: newUserData.gender,
          dob: newUserData.dob,
          passwordHash: newUserData.passwordHash,
          role: 'USER',
        }
      });
    } catch (syncErr) {
      console.warn("Notice: Prisma user sync deferred:", syncErr instanceof Error ? syncErr.message : syncErr);
    }

    const { createUserToken } = await import('../../../lib/auth');
    const token = await createUserToken(newUserData.email, 'customer');

    const response = NextResponse.json({ 
      success: true, 
      data: {
        name: newUserData.name,
        email: newUserData.email,
        phone: newUserData.phone || '',
        gender: newUserData.gender || '',
        dob: newUserData.dob || '',
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

    try {
      const dbPath = path.join(process.cwd(), 'src/data/db.json');
      if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (Array.isArray(data.users)) {
          const userIndex = data.users.findIndex((u: any) => u.id === body.id || u.email === body.email);
          if (userIndex !== -1) {
            data.users[userIndex].role = targetRole;
            fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
          }
        }
      }
    } catch (_e) {}

    try {
      const updatedUser = await prisma.user.update({
        where: { id: body.id },
        data: {
          role: targetRole
        }
      });
      return NextResponse.json({ success: true, data: sanitizeUser(updatedUser) });
    } catch (syncErr) {
      console.warn("Notice: Prisma user update sync deferred:", syncErr instanceof Error ? syncErr.message : syncErr);
      return NextResponse.json({ success: true, message: 'Role updated in local storage' });
    }
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
