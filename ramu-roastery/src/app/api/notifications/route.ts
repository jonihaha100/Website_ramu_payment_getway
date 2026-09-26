import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAdmin, getUserSession } from '../../../lib/auth';

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

    const notifications = await prisma.notification.findMany({
      where: { userEmail: cleanEmail },
      orderBy: { createdAt: 'desc' }
    });

    // Map createdAt to time to maintain backward compatibility with old frontend format
    const formatted = notifications.map(n => ({
      ...n,
      time: n.createdAt
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
    
    const newNotification = await prisma.notification.create({
      data: {
        userEmail: (body.userEmail || '').toLowerCase().trim(),
        title: body.title,
        desc: body.desc,
        href: body.href || '#',
      }
    });

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

      await prisma.notification.updateMany({
        where: { userEmail: cleanEmail, read: false },
        data: { read: true }
      });
      return NextResponse.json({ message: 'All notifications marked as read' });
    } else if (body.id) {
      const existing = await prisma.notification.findUnique({ where: { id: body.id } });
      if (!existing) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      if (!isAdmin && (!session || session.email.toLowerCase() !== existing.userEmail.toLowerCase())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updated = await prisma.notification.update({
        where: { id: body.id },
        data: { read: true }
      });
      return NextResponse.json({ message: 'Notification marked as read', notification: updated });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
