import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/addresses?email=xxx
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const addresses = await prisma.address.findMany({
      where: { userEmail: email },
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
    console.log("ADDRESS POST BODY:", body);
    const { id, userEmail, label, firstName, lastName, phone, address, province, city, subdistrict, village, postalCode, isDefault } = body;

    if (!userEmail || !label || !firstName || !lastName || !phone || !address || !province || !city || !postalCode) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    // If setting as default, unset all others first
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userEmail },
        data: { isDefault: false }
      });
    }

    if (id) {
      // Update existing or create if missing (to prevent P2025 Record Not Found)
      const updated = await prisma.address.upsert({
        where: { id },
        update: { label, firstName, lastName, phone, address, province, city, subdistrict, village, postalCode, isDefault: isDefault || false },
        create: { id, userEmail, label, firstName, lastName, phone, address, province, city, subdistrict: subdistrict || null, village: village || null, postalCode, isDefault: isDefault || false }
      });
      return NextResponse.json({ success: true, data: updated });
    } else {
      // Create new
      const created = await prisma.address.create({
        data: { userEmail, label, firstName, lastName, phone, address, province, city, subdistrict: subdistrict || null, village: village || null, postalCode, isDefault: isDefault || false }
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

    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Address delete error:', error);
    return NextResponse.json({ error: 'Gagal menghapus alamat' }, { status: 500 });
  }
}
