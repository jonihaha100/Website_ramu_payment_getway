import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAdmin, getUserSession } from '../../../lib/auth';

// GET /api/addresses?email=xxx
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminCheck = await requireAdmin(req);
    const isAdmin = !adminCheck;
    const session = await getUserSession(req);
    const isOwner = session && session.email.toLowerCase() === cleanEmail;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Silakan login untuk melihat daftar alamat Anda.' },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userEmail: cleanEmail },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Addresses fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST /api/addresses — Create or Update
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userEmail, label, firstName, lastName, phone, address, province, city, subdistrict, village, postalCode, isDefault } = body;

    if (!userEmail || !label || !firstName || !lastName || !phone || !address || !province || !city || !postalCode) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    const adminCheck = await requireAdmin(req);
    const isAdmin = !adminCheck;
    const session = await getUserSession(req);
    const isOwner = session && session.email.toLowerCase() === cleanEmail;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Akses ditolak. Sesi tidak sah.' },
        { status: 401 }
      );
    }

    // If setting as default, unset all others first
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userEmail: cleanEmail },
        data: { isDefault: false }
      });
    }

    if (id) {
      // Anti-IDOR: Check if existing address belongs to user if not admin
      const existingAddr = await prisma.address.findUnique({ where: { id } });
      if (existingAddr && !isAdmin && existingAddr.userEmail.toLowerCase() !== cleanEmail) {
        return NextResponse.json({ error: 'Forbidden: Anda tidak berhak mengubah alamat ini.' }, { status: 403 });
      }

      const updated = await prisma.address.upsert({
        where: { id },
        update: { label, firstName, lastName, phone, address, province, city, subdistrict, village, postalCode, isDefault: isDefault || false },
        create: { id, userEmail: cleanEmail, label, firstName, lastName, phone, address, province, city, subdistrict: subdistrict || null, village: village || null, postalCode, isDefault: isDefault || false }
      });
      return NextResponse.json({ success: true, data: updated });
    } else {
      // Create new
      const created = await prisma.address.create({
        data: { userEmail: cleanEmail, label, firstName, lastName, phone, address, province, city, subdistrict: subdistrict || null, village: village || null, postalCode, isDefault: isDefault || false }
      });
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }
  } catch (error) {
    console.error('Address save error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan alamat' }, { status: 500 });
  }
}

// DELETE /api/addresses?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });
    }

    const existingAddr = await prisma.address.findUnique({ where: { id } });
    if (!existingAddr) {
      return NextResponse.json({ error: 'Alamat tidak ditemukan' }, { status: 404 });
    }

    const adminCheck = await requireAdmin(req);
    const isAdmin = !adminCheck;
    const session = await getUserSession(req);
    const isOwner = session && session.email.toLowerCase() === existingAddr.userEmail.toLowerCase();

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses untuk menghapus alamat ini.' }, { status: 403 });
    }

    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Address delete error:', error);
    return NextResponse.json({ error: 'Gagal menghapus alamat' }, { status: 500 });
  }
}
