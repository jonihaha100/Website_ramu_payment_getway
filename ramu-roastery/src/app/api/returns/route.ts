import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAdmin, getUserSession } from '../../../lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    // Check if requester is Admin or the customer owning the email
    const adminCheck = await requireAdmin(request);
    const isAdmin = !adminCheck;

    if (userEmail) {
      const cleanEmail = userEmail.toLowerCase().trim();
      const session = await getUserSession(request);
      const isOwner = session && session.email.toLowerCase() === cleanEmail;

      if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: 'Unauthorized: Sesi tidak sah.' }, { status: 401 });
      }

      const returns = await prisma.returnTicket.findMany({
        where: { customerEmail: cleanEmail },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(returns);
    }

    // All returns listing strictly requires Admin
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Diperlukan hak akses Admin.' }, { status: 401 });
    }

    const returns = await prisma.returnTicket.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error("Failed to fetch returns:", error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newReturn = await prisma.returnTicket.create({
      data: {
        orderId: body.orderId || 'Unknown',
        customerEmail: (body.customerEmail || '').toLowerCase().trim(),
        customerName: body.customerName,
        itemName: body.itemName,
        reason: body.reason,
        description: body.description,
        proofImageUrl: body.proofImageUrl || '',
        status: 'Pending'
      }
    });

    // Notify Admin
    try {
      await prisma.notification.create({
        data: {
          userEmail: "admin@ramuroastery.com",
          title: "Pengajuan Pengembalian Baru",
          desc: `Pengajuan retur untuk pesanan ${body.orderId || 'Unknown'} dari ${body.customerName}`,
          href: "/admin/returns"
        }
      });
    } catch (e) {
      console.error("Failed to notify admin", e);
    }
    return NextResponse.json({ message: 'Return submitted successfully', data: newReturn }, { status: 201 });
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    const existingReturn = await prisma.returnTicket.findUnique({
      where: { id: body.id }
    });

    if (!existingReturn) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const adminCheck = await requireAdmin(request);
    const isAdmin = !adminCheck;
    const session = await getUserSession(request);
    const isOwner = session && session.email.toLowerCase() === existingReturn.customerEmail?.toLowerCase();

    // If changing status or adminNotes, strictly require Admin
    if ((body.status !== undefined && body.status !== existingReturn.status) || body.adminNotes !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Hanya Admin yang dapat mengubah status pengembalian.' }, { status: 403 });
      }
    }

    // If updating returnTrackingNumber, must be Admin or the owner
    if (body.returnTrackingNumber !== undefined && !isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden: Akses ditolak.' }, { status: 403 });
    }

    let updatedStatus = body.status;
    if (body.returnTrackingNumber && existingReturn.status === 'Approved') {
      updatedStatus = 'In Transit';
    }

    await prisma.returnTicket.update({
      where: { id: body.id },
      data: {
        status: updatedStatus !== undefined ? updatedStatus : existingReturn.status,
        adminNotes: isAdmin && body.adminNotes !== undefined ? body.adminNotes : existingReturn.adminNotes,
        returnTrackingNumber: body.returnTrackingNumber !== undefined ? body.returnTrackingNumber : existingReturn.returnTrackingNumber
      }
    });

    // Notify Customer
    if (updatedStatus && updatedStatus !== existingReturn.status && existingReturn.customerEmail) {
      try {
        await prisma.notification.create({
          data: {
            userEmail: existingReturn.customerEmail,
            title: "Status Retur Diperbarui",
            desc: `Status pengembalian pesanan ${existingReturn.orderId} menjadi: ${updatedStatus}`,
            href: "/dashboard/returns"
          }
        });
      } catch (e) {
        console.error("Failed to notify customer", e);
      }
    }

    return NextResponse.json({ message: 'Return updated successfully' });
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
