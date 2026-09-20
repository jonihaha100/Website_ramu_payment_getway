import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const closings = await prisma.closing.findMany({
      orderBy: { closedAt: 'desc' }
    });
    return NextResponse.json(closings);
  } catch (error) {
    console.error("Failed to fetch closings:", error);
    return NextResponse.json({ error: 'Failed to fetch closings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if already closed for this period to prevent duplicates
    const existing = await prisma.closing.findUnique({
      where: { period: body.period }
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Bulan ini sudah ditutup bukukan sebelumnya.' }, { status: 400 });
    }

    // 1. Create the Closing record
    const newClosing = await prisma.closing.create({
      data: {
        period: body.period,
        grossSales: body.grossSales,
        discounts: body.discounts,
        netSales: body.netSales,
        taxCollected: body.taxCollected,
        shippingRevenue: body.shippingRevenue,
        adminFeeRevenue: body.adminFeeRevenue,
        totalCashInflow: body.totalCashInflow,
        totalOrders: body.totalOrders,
        itemsSold: body.itemsSold,
        closedBy: body.closedBy || 'Admin'
      }
    });
    
    // 2. Lock the orders by linking them to the new Closing record
    if (body.orderIds && body.orderIds.length > 0) {
      await prisma.order.updateMany({
        where: { id: { in: body.orderIds } },
        data: { closedPeriodId: newClosing.id }
      });
    }
    
    return NextResponse.json({ success: true, data: newClosing }, { status: 201 });
  } catch (error) {
    console.error("Failed to save closing:", error);
    return NextResponse.json({ error: 'Failed to save closing' }, { status: 500 });
  }
}
