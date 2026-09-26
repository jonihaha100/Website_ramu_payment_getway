import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export async function GET() {
  try {
    let settings = await prisma.storeSetting.findUnique({
      where: { id: 'global' }
    });

    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: {
          id: 'global',
          flatShippingRate: 15000,
          isFreeShippingEnabled: false,
          freeShippingThreshold: 500000,
          taxRate: 10,
          adminFee: 2500,
          activeCouriers: 'JNE,Sicepat,J&T'
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    
    const settings = await prisma.storeSetting.upsert({
      where: { id: 'global' },
      update: {
        flatShippingRate: body.flatShippingRate !== undefined ? Number(body.flatShippingRate) : undefined,
        isFreeShippingEnabled: body.isFreeShippingEnabled !== undefined ? Boolean(body.isFreeShippingEnabled) : undefined,
        freeShippingThreshold: body.freeShippingThreshold !== undefined ? Number(body.freeShippingThreshold) : undefined,
        taxRate: body.taxRate !== undefined ? Number(body.taxRate) : undefined,
        adminFee: body.adminFee !== undefined ? Number(body.adminFee) : undefined,
        activeCouriers: body.activeCouriers !== undefined ? String(body.activeCouriers) : undefined,
      },
      create: {
        id: 'global',
        flatShippingRate: body.flatShippingRate !== undefined ? Number(body.flatShippingRate) : 15000,
        isFreeShippingEnabled: body.isFreeShippingEnabled !== undefined ? Boolean(body.isFreeShippingEnabled) : false,
        freeShippingThreshold: body.freeShippingThreshold !== undefined ? Number(body.freeShippingThreshold) : 500000,
        taxRate: body.taxRate !== undefined ? Number(body.taxRate) : 10,
        adminFee: body.adminFee !== undefined ? Number(body.adminFee) : 2500,
        activeCouriers: body.activeCouriers !== undefined ? String(body.activeCouriers) : 'JNE,Sicepat,J&T'
      }
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
