import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAdmin, getUserSession } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';

function getStoredReturns(): any[] {
  try {
    const dbPath = path.join(process.cwd(), 'src/data/db.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      return data.returns || [];
    }
  } catch (_e) {}
  return [];
}

function saveStoredReturn(ret: any) {
  try {
    const dbPath = path.join(process.cwd(), 'src/data/db.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (!data.returns) data.returns = [];
      data.returns.unshift(ret);
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (err) {
    console.error("Failed to save return ticket to db.json:", err);
  }
}

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

      try {
        const returns = await prisma.returnTicket.findMany({
          where: { customerEmail: cleanEmail },
          orderBy: { createdAt: 'desc' }
        });
        if (returns && returns.length > 0) {
          return NextResponse.json(returns);
        }
      } catch (dbErr) {
        console.warn("Notice: Prisma returns fetch deferred:", dbErr instanceof Error ? dbErr.message : dbErr);
      }

      const stored = getStoredReturns();
      return NextResponse.json(stored.filter((r: any) => (r.customerEmail || '').toLowerCase() === cleanEmail));
    }

    // All returns listing strictly requires Admin
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Diperlukan hak akses Admin.' }, { status: 401 });
    }

    try {
      const returns = await prisma.returnTicket.findMany({
        orderBy: { createdAt: 'desc' }
      });
      if (returns && returns.length > 0) {
        return NextResponse.json(returns);
      }
    } catch (dbErr) {
      console.warn("Notice: Prisma all returns fetch deferred:", dbErr instanceof Error ? dbErr.message : dbErr);
    }

    return NextResponse.json(getStoredReturns());
  } catch (error) {
    console.warn("Returns fetch notice (serving fallback):", error instanceof Error ? error.message : error);
    return NextResponse.json(getStoredReturns());
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cleanEmail = (body.customerEmail || '').toLowerCase().trim();
    
    const newReturn = {
      id: `ret-${Date.now()}`,
      orderId: body.orderId || 'Unknown',
      customerEmail: cleanEmail,
      customerName: body.customerName,
      itemName: body.itemName,
      reason: body.reason,
      description: body.description,
      proofImageUrl: body.proofImageUrl || '',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    saveStoredReturn(newReturn);

    try {
      await prisma.returnTicket.create({
        data: {
          id: newReturn.id,
          orderId: newReturn.orderId,
          customerEmail: newReturn.customerEmail,
          customerName: newReturn.customerName,
          itemName: newReturn.itemName,
          reason: newReturn.reason,
          description: newReturn.description,
          proofImageUrl: newReturn.proofImageUrl,
          status: 'Pending'
        }
      });
    } catch (syncErr) {
      console.warn("Notice: Prisma return ticket sync deferred:", syncErr instanceof Error ? syncErr.message : syncErr);
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
    
    const stored = getStoredReturns();
    let existingReturn: any = null;

    try {
      existingReturn = await prisma.returnTicket.findUnique({
        where: { id: body.id }
      });
    } catch (_e) {}

    if (!existingReturn) {
      existingReturn = stored.find((r: any) => r.id === body.id);
    }

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

    // Update db.json
    try {
      const dbPath = path.join(process.cwd(), 'src/data/db.json');
      if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (Array.isArray(data.returns)) {
          const idx = data.returns.findIndex((r: any) => r.id === body.id);
          if (idx !== -1) {
            if (updatedStatus !== undefined) data.returns[idx].status = updatedStatus;
            if (isAdmin && body.adminNotes !== undefined) data.returns[idx].adminNotes = body.adminNotes;
            if (body.returnTrackingNumber !== undefined) data.returns[idx].returnTrackingNumber = body.returnTrackingNumber;
            fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
          }
        }
      }
    } catch (_e) {}

    try {
      await prisma.returnTicket.update({
        where: { id: body.id },
        data: {
          status: updatedStatus !== undefined ? updatedStatus : existingReturn.status,
          adminNotes: isAdmin && body.adminNotes !== undefined ? body.adminNotes : existingReturn.adminNotes,
          returnTrackingNumber: body.returnTrackingNumber !== undefined ? body.returnTrackingNumber : existingReturn.returnTrackingNumber
        }
      });
    } catch (syncErr) {
      console.warn("Notice: Prisma return ticket update sync deferred:", syncErr instanceof Error ? syncErr.message : syncErr);
    }

    return NextResponse.json({ message: 'Return updated successfully' });
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
