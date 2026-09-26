import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../../../lib/auth';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { customSourcing: [], notifications: [] };
  }
};

const writeDB = (data: unknown) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export async function GET(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const db = readDB();
    const customSourcing = db.customSourcing || [];
    
    // Sort by date descending (newest first)
    customSourcing.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(customSourcing);
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDB();
    
    if (!db.customSourcing) {
      db.customSourcing = [];
    }
    
    if (!db.notifications) {
      db.notifications = [];
    }

    const newRequest = {
      id: `CS-${Date.now()}`,
      name: body.name,
      businessName: body.businessName || '-',
      phone: body.phone,
      purposeText: body.purposeText,
      flavorText: body.flavorText,
      volumeText: body.volumeText,
      status: 'Pending',
      date: new Date().toISOString()
    };

    db.customSourcing.unshift(newRequest); // Add to top

    const newNotification = {
      id: `NOTIF-${Date.now()}`,
      userEmail: 'admin@ramuroastery.com',
      title: 'Permintaan Custom Sourcing Baru',
      desc: `Permintaan dari ${newRequest.name} (${newRequest.businessName}) - Volume: ${newRequest.volumeText}.`,
      href: '/admin/custom-sourcing',
      time: new Date().toISOString(),
      read: false
    };

    db.notifications.unshift(newNotification);

    writeDB(db);
    return NextResponse.json({ message: 'Request submitted successfully', data: newRequest }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const db = readDB();
    
    if (!db.customSourcing) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    const index = db.customSourcing.findIndex((req: any) => req.id === body.id);
    if (index !== -1) {
      db.customSourcing[index].status = body.status;
      writeDB(db);
      return NextResponse.json({ message: 'Status updated' });
    }
    
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const db = readDB();
    
    if (!db.customSourcing) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    const initialLength = db.customSourcing.length;
    db.customSourcing = db.customSourcing.filter((req: any) => req.id !== id);

    if (db.customSourcing.length !== initialLength) {
      writeDB(db);
      return NextResponse.json({ message: 'Request deleted successfully' });
    }
    
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
