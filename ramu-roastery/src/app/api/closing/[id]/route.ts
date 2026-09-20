import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const closingId = params.id;
    
    const closing = await prisma.closing.findUnique({
      where: { id: closingId },
      include: {
        lockedOrders: {
          include: { items: true }
        }
      }
    });

    if (!closing) {
      return NextResponse.json({ error: 'Closing record not found' }, { status: 404 });
    }

    // Map order.createdAt to order.date for frontend compatibility
    const mappedOrders = closing.lockedOrders.map(order => ({
      ...order,
      date: order.createdAt
    }));
    
    const mappedClosing = {
      ...closing,
      lockedOrders: mappedOrders
    };

    return NextResponse.json(mappedClosing);
  } catch (error) {
    console.error("Failed to fetch closing details:", error);
    return NextResponse.json({ error: 'Failed to fetch closing details' }, { status: 500 });
  }
}
