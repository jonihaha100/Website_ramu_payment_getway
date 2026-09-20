import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    // If not filtered by a specific user email, request strictly requires Admin privileges
    if (!userEmail) {
      const authError = await requireAdmin(request);
      if (authError) return authError;
    }

    const returns = await prisma.returnTicket.findMany({
      where: userEmail ? { customerEmail: userEmail } : undefined,
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
        customerEmail: body.customerEmail,
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

    if (existingReturn) {
      let updatedStatus = body.status;
      if (body.returnTrackingNumber && existingReturn.status === 'Approved') {
        updatedStatus = 'In Transit';
      }

      await prisma.returnTicket.update({
        where: { id: body.id },
        data: {
          status: updatedStatus !== undefined ? updatedStatus : existingReturn.status,
          adminNotes: body.adminNotes !== undefined ? body.adminNotes : existingReturn.adminNotes,
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
    }
    
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
