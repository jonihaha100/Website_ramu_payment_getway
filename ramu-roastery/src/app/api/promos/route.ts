import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

const globalPromosCache = globalThis as unknown as {
  __cachedPromos?: any[];
  __lastPromosFetchTime?: number;
};
const PROMOS_CACHE_TTL = 60000;

export async function GET() {
  const cached = globalPromosCache.__cachedPromos;
  const lastTime = globalPromosCache.__lastPromosFetchTime || 0;

  if (cached && cached.length > 0 && (Date.now() - lastTime < PROMOS_CACHE_TTL)) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  }

  try {
    const fetchPromise = prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Promo DB connection timeout')), 600)
    );
    const promos = await Promise.race([fetchPromise, timeoutPromise]) as any[];
    globalPromosCache.__cachedPromos = promos;
    globalPromosCache.__lastPromosFetchTime = Date.now();
    return NextResponse.json(promos, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    if (cached) return NextResponse.json(cached);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    
    // Validate
    if (!body.code || !body.discountType || !body.discountValue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingPromo = await prisma.promoCode.findUnique({
      where: { code: body.code.toUpperCase() }
    });

    if (existingPromo) {
      return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 });
    }

    const newPromo = await prisma.promoCode.create({
      data: {
        code: body.code.toUpperCase(),
        discountType: body.discountType, // 'percentage' or 'fixed'
        discountValue: Number(body.discountValue),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        maxUses: body.maxUses ? Number(body.maxUses) : null,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    });

    globalPromosCache.__cachedPromos = undefined;
    globalPromosCache.__lastPromosFetchTime = 0;

    return NextResponse.json({ success: true, data: newPromo }, { status: 201 });
  } catch (error) {
    console.error("Failed to save promo:", error);
    return NextResponse.json({ error: 'Failed to save promo' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'Missing promo ID' }, { status: 400 });
    }

    const updatedPromo = await prisma.promoCode.update({
      where: { id: body.id },
      data: {
        code: body.code?.toUpperCase(),
        discountType: body.discountType,
        discountValue: body.discountValue ? Number(body.discountValue) : undefined,
        validUntil: body.validUntil !== undefined ? (body.validUntil ? new Date(body.validUntil) : null) : undefined,
        maxUses: body.maxUses !== undefined ? (body.maxUses ? Number(body.maxUses) : null) : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined
      }
    });

    globalPromosCache.__cachedPromos = undefined;
    globalPromosCache.__lastPromosFetchTime = 0;

    return NextResponse.json({ success: true, data: updatedPromo });
  } catch (error) {
    console.error("Failed to update promo:", error);
    return NextResponse.json({ error: 'Failed to update promo' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing promo ID' }, { status: 400 });

    await prisma.promoCode.delete({
      where: { id }
    });
    
    globalPromosCache.__cachedPromos = undefined;
    globalPromosCache.__lastPromosFetchTime = 0;

    return NextResponse.json({ success: true, message: 'Promo deleted' });
  } catch (error) {
    console.error("Failed to delete promo:", error);
    return NextResponse.json({ error: 'Failed to delete promo' }, { status: 500 });
  }
}
