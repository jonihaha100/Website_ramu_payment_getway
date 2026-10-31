import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAdmin, getUserSession } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';

function getDbNotifications(): any[] {
  try {
    const dbPath = path.join(process.cwd(), 'src/data/db.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      return data.notifications || [];
    }
  } catch (err) {
    console.error("Failed to read notifications from db.json:", err);
  }
  return [];
}

function saveDbNotification(notification: any) {
  try {
    const dbPath = path.join(process.cwd(), 'src/data/db.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (!data.notifications) data.notifications = [];
      data.notifications.unshift(notification);
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (err) {
    console.error("Failed to save notification to db.json:", err);
  }
}

function updateDbNotifications(predicate: (n: any) => boolean) {
  try {
    const dbPath = path.join(process.cwd(), 'src/data/db.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (Array.isArray(data.notifications)) {
        data.notifications.forEach((n: any) => {
          if (predicate(n)) {
            n.read = true;
          }
        });
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
      }
    }
  } catch (err) {
    console.error("Failed to update notification in db.json:", err);
  }
}

// GET /api/notifications?userEmail=admin@example.com
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    const adminCheck = await requireAdmin(request);
    const isAdmin = !adminCheck;
    const session = await getUserSession(request);
    const isOwner = session && session.email.toLowerCase() === cleanEmail;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak sah untuk melihat notifikasi ini.' },
        { status: 401 }
      );
    }

    let notifications: any[] = [];
    try {
      notifications = await prisma.notification.findMany({
        where: { userEmail: cleanEmail },
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbErr) {
      console.warn("Notice: Prisma notification fetch deferred, falling back to db.json:", dbErr instanceof Error ? dbErr.message : dbErr);
      const stored = getDbNotifications();
      notifications = stored.filter((n: any) => (n.userEmail || '').toLowerCase() === cleanEmail);
    }

    // Map createdAt to time to maintain backward compatibility with old frontend format
    const formatted = notifications.map((n: any) => ({
      ...n,
      time: n.createdAt || n.time || new Date().toISOString()
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.warn("Notice: Database notification fetch deferred:", error instanceof Error ? error.message : error);
    return NextResponse.json([]);
  }
}

// POST /api/notifications
// Body: { userEmail, title, desc, href }
export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin(request);
    const isAdmin = !adminCheck;
    const session = await getUserSession(request);

    if (!isAdmin && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const cleanEmail = (body.userEmail || '').toLowerCase().trim();

    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userEmail: cleanEmail,
      title: body.title,
      desc: body.desc,
      href: body.href || '#',
      read: false,
      createdAt: new Date().toISOString()
    };

    saveDbNotification(newNotification);

    try {
      await prisma.notification.create({
        data: {
          userEmail: cleanEmail,
          title: body.title,
          desc: body.desc,
          href: body.href || '#',
        }
      });
    } catch (syncErr) {
      console.warn("Notice: Prisma notification sync deferred:", syncErr instanceof Error ? syncErr.message : syncErr);
    }

    return NextResponse.json({ message: 'Notification created successfully', notification: newNotification }, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PUT /api/notifications (Mark as read)
// Body: { id } or { markAllAsRead: true, userEmail }
export async function PUT(request: Request) {
  try {
    const adminCheck = await requireAdmin(request);
    const isAdmin = !adminCheck;
    const session = await getUserSession(request);

    if (!isAdmin && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (body.markAllAsRead && body.userEmail) {
      const cleanEmail = body.userEmail.toLowerCase().trim();
      if (!isAdmin && (!session || session.email.toLowerCase() !== cleanEmail)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      updateDbNotifications((n) => (n.userEmail || '').toLowerCase() === cleanEmail && !n.read);

      try {
        await prisma.notification.updateMany({
          where: { userEmail: cleanEmail, read: false },
          data: { read: true }
        });
      } catch (syncErr) {
        console.warn("Notice: Prisma markAllAsRead sync deferred:", syncErr instanceof Error ? syncErr.message : syncErr);
      }

      return NextResponse.json({ message: 'All notifications marked as read' });
    } else if (body.id) {
      updateDbNotifications((n) => n.id === body.id);

      try {
        const existing = await prisma.notification.findUnique({ where: { id: body.id } });
        if (existing) {
          if (!isAdmin && (!session || session.email.toLowerCase() !== existing.userEmail.toLowerCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
          await prisma.notification.update({
            where: { id: body.id },
            data: { read: true }
          });
        }
      } catch (syncErr) {
        console.warn("Notice: Prisma markRead sync deferred:", syncErr instanceof Error ? syncErr.message : syncErr);
      }

      return NextResponse.json({ message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
