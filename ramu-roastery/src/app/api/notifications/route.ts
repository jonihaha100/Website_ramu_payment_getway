import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/notifications?userEmail=admin@example.com
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userEmail },
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
    const body = await request.json();
    
    const newNotification = await prisma.notification.create({
      data: {
        userEmail: body.userEmail,
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
    const body = await request.json();

    if (body.markAllAsRead && body.userEmail) {
      await prisma.notification.updateMany({
        where: { userEmail: body.userEmail, read: false },
        data: { read: true }
      });
      return NextResponse.json({ message: 'All notifications marked as read' });
    } else if (body.id) {
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
