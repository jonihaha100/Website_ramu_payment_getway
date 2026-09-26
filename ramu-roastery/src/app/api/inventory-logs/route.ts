import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../../../lib/auth';

// Define the path to our local JSON database (for updating stock)
const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

const readDB = () => {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

const writeDB = (data: unknown) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export async function GET(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const filter = productId ? { productId } : {};

    const logs = await prisma.inventoryLog.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch inventory logs:", error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { productId, changeAmount, type, notes } = body;

    if (!productId || changeAmount === undefined || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Read current product from db.json
    const db = readDB();
    const productIndex = db.products.findIndex((p: any) => p.id === productId);
    
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentProduct = db.products[productIndex];
    const newStock = currentProduct.stock + changeAmount;

    // Update db.json
    db.products[productIndex].stock = newStock;
    writeDB(db);

    // Save log to Prisma
    const newLog = await prisma.inventoryLog.create({
      data: {
        productId,
        productName: currentProduct.name,
        changeAmount: Number(changeAmount),
        newStock: newStock,
        type: type, // "STOCK_IN", "ADJUSTMENT"
        notes: notes || ""
      }
    });

    return NextResponse.json({ success: true, data: newLog, newStock }, { status: 201 });
  } catch (error) {
    console.error("Failed to save inventory log:", error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
