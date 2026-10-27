import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/points?email=xxx: Get balance and history
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
    console.warn('Points fetch notice (serving fallback):', error instanceof Error ? error.message : error);
    return NextResponse.json({ balance: 0, history: [] });
  }
}

// POST endpoint has been removed for security. 
// Points are now only awarded securely via internal server logic (e.g. in /api/orders or /api/checkout).
