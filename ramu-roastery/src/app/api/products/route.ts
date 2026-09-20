import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Define the path to our local JSON database
const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

// In-memory cache based on file modification time
let cachedProducts: any = null;
let lastMtime = 0;

// Helper to read DB asynchronously
const readDBAsync = async () => {
  try {
    const stat = await fs.stat(dbPath);
    if (cachedProducts && stat.mtimeMs === lastMtime) {
      return { products: cachedProducts };
    }
    const data = await fs.readFile(dbPath, 'utf8');
    const db = JSON.parse(data);
    
    cachedProducts = db.products;
    lastMtime = stat.mtimeMs;
    
    return db;
  } catch (e) {
    throw e;
  }
};

const writeDBAsync = async (data: unknown) => {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
  const stat = await fs.stat(dbPath);
  cachedProducts = (data as any).products;
  lastMtime = stat.mtimeMs;
};

export async function GET() {
  try {
    const db = await readDBAsync();
    return NextResponse.json(db.products, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error("Error reading DB:", error);
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newProduct = await request.json();
    const db = await readDBAsync();
    db.products.push(newProduct);
    await writeDBAsync(db);
    return NextResponse.json({ message: 'Product added successfully', product: newProduct });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedProduct = await request.json();
    const db = await readDBAsync();
    const index = db.products.findIndex((p: { id: string }) => p.id === updatedProduct.id);
    
    if (index !== -1) {
      db.products[index] = updatedProduct;
      await writeDBAsync(db);
      return NextResponse.json({ message: 'Product updated successfully', product: updatedProduct });
    }
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });

    const db = await readDBAsync();
    db.products = db.products.filter((p: { id: string }) => p.id !== id);
    await writeDBAsync(db);
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
