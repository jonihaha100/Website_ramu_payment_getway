import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/points?email=xxx — Get balance and history
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const records = await prisma.ramuPoints.findMany({
      where: { userEmail: email },
      orderBy: { createdAt: 'desc' }
    });

    const balance = records.reduce((sum, r) => sum + r.amount, 0);

    return NextResponse.json({ balance, history: records });
  } catch (error) {
    console.error('Points fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  }
}

// POST endpoint has been removed for security. 
// Points are now only awarded securely via internal server logic (e.g. in /api/orders or /api/checkout).
