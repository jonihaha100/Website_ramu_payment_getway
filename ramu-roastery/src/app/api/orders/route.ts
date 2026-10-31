import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { mockOrders } from '../../../data/mockOrders';
import { requireAdmin, getUserSession } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';

// Helper to reliably read stored orders from local db.json with mockOrders fallback
function getStoredOrders(): any[] {
  try {
    const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
    if (fs.existsSync(dbPath)) {
      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (Array.isArray(dbData.orders)) {
        return dbData.orders.map((o: any) => ({
          ...o,
          date: o.date || o.createdAt || new Date().toISOString(),
          createdAt: o.createdAt || o.date || new Date().toISOString(),
          items: Array.isArray(o.items) ? o.items : []
        }));
      }
    }
  } catch (err) {
    console.error("Error reading stored orders from db.json:", err);
  }
  return mockOrders;
}

// In-memory cache fallback to prevent crashes during database network latency
let cachedOrders: any[] = [];

// Privacy & PII Masking Helpers (UU PDP / Anti-Data Scraping)
function maskName(name: string | null | undefined): string {
  if (!name) return "-";
  const parts = name.trim().split(/\s+/);
  return parts.map(p => p.length > 1 ? `${p[0]}${'*'.repeat(Math.min(p.length - 1, 3))}` : p).join(' ');
}

function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return "-";
  const [user, domain] = email.split('@');
  const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}***`;
  return `${maskedUser}@${domain}`;
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const clean = phone.trim();
  if (clean.length <= 6) return clean.replace(/.(?=.{2})/g, '*');
  return `${clean.slice(0, 4)}****${clean.slice(-3)}`;
}

function maskAddress(address: string | null | undefined): string {
  if (!address) return "-";
  const parts = address.split(',');
  if (parts.length >= 2) {
    const lastTwo = parts.slice(-2).map(p => p.trim()).join(', ');
    return `***, ${lastTwo}`;
  }
  return "***, Alamat Pengiriman Terproteksi";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('customerEmail') || searchParams.get('email');
    const search = searchParams.get('search') || searchParams.get('orderId') || searchParams.get('resi');

    // 1. Single Order or Tracking Number lookup (for Order Tracking page)
    if (search) {
      const cleanSearch = search.trim();
      let order: any = null;
      try {
        order = await prisma.order.findFirst({
          where: {
            OR: [
              { id: { equals: cleanSearch, mode: 'insensitive' } },
              { trackingNumber: { equals: cleanSearch, mode: 'insensitive' } }
            ]
          },
          include: { items: true }
        });
      } catch (_e) {
        // Prisma unavailable, fallback to stored orders
      }

      if (!order) {
        const stored = getStoredOrders();
        order = stored.find((o: any) => 
          o.id?.toLowerCase() === cleanSearch.toLowerCase() ||
          (o.trackingNumber && o.trackingNumber.toLowerCase() === cleanSearch.toLowerCase())
        );
      }

      if (order) {
        // Check if requester is Admin or the authenticated customer owning this order
        const adminCheck = await requireAdmin(request);
        const isAdmin = !adminCheck;
        const userSession = await getUserSession(request);
        const isOwner = userSession && userSession.email.toLowerCase() === order.customerEmail?.toLowerCase();

        if (isAdmin || isOwner) {
          // Authorized: return full unmasked order details
          return NextResponse.json([{ ...order, date: order.createdAt || order.date }]);
        }

        // Public Tracking: SANITIZE & MASK PII (Anti-Scraping / Anti-IDOR)
        const maskedOrder = {
          id: order.id,
          status: order.status,
          date: order.createdAt || order.date,
          createdAt: order.createdAt || order.date,
          trackingNumber: order.trackingNumber,
          courier: order.courier,
          total: order.total,
          items: (order.items || []).map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          // Masked Personal Information:
          customerName: maskName(order.customerName),
          customerEmail: maskEmail(order.customerEmail),
          customerPhone: maskPhone(order.customerPhone),
          shippingAddress: maskAddress(order.shippingAddress)
        };

        return NextResponse.json([maskedOrder]);
      }
      return NextResponse.json([]);
    }

    // 2. Filter by specific customer email (for Customer Dashboard)
    // Anti-IDOR: Only Admin OR the verified logged-in customer may view their order history
    if (customerEmail) {
      const cleanEmail = customerEmail.toLowerCase().trim();
      const adminCheck = await requireAdmin(request);
      const isAdmin = !adminCheck;
      const userSession = await getUserSession(request);
      const isOwner = userSession && userSession.email.toLowerCase() === cleanEmail;

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: "Unauthorized: Silakan login ke akun Anda untuk melihat riwayat pesanan." },
          { status: 401 }
        );
      }

      try {
        const orders = await prisma.order.findMany({
          where: {
            customerEmail: cleanEmail
          },
          include: { items: true },
          orderBy: { createdAt: 'desc' }
        });
        if (orders && orders.length > 0) {
          return NextResponse.json(orders.map(order => ({ ...order, date: order.createdAt })));
        }
      } catch (_e) {
        // Database connection timeout/failure, gracefully fallback to stored db.json
      }

      const stored = getStoredOrders();
      const userOrders = stored.filter((o: any) => o.customerEmail?.toLowerCase() === cleanEmail);
      return NextResponse.json(userOrders);
    }

    // 3. Fetching ALL orders: STRICTLY requires Admin Session to protect user privacy (Anti-IDOR / Anti-Scraping)
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
      const orders = await prisma.order.findMany({
        include: {
          items: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      if (orders && orders.length > 0) {
        const mappedOrders = orders.map(order => ({
          ...order,
          date: order.createdAt
        }));
        cachedOrders = mappedOrders;
        return NextResponse.json(mappedOrders);
      }
    } catch (_e) {
      // Database connection timeout/failure, gracefully fallback to stored db.json
    }

    const storedOrders = getStoredOrders();
    cachedOrders = storedOrders;
    return NextResponse.json(storedOrders);
  } catch (error) {
    console.warn("Database notice: orders query failed or timed out, serving cached/mock fallback:", error instanceof Error ? error.message : error);
    if (cachedOrders && cachedOrders.length > 0) {
      return NextResponse.json(cachedOrders);
    }
    return NextResponse.json(getStoredOrders());
  }
}

export async function PUT(request: Request) {
  try {
    const updatedOrder = await request.json();
    if (!updatedOrder.id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    let existingOrder: any = null;
    try {
      existingOrder = await prisma.order.findUnique({
        where: { id: updatedOrder.id }
      });
    } catch (_e) {}

    if (!existingOrder) {
      const stored = getStoredOrders();
      existingOrder = stored.find((o: any) => o.id === updatedOrder.id);
    }

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security Check: Verify if caller is Admin or verified Customer session
    const adminCheck = await requireAdmin(request);
    const isAdmin = !adminCheck;

    if (!isAdmin) {
      const userSession = await getUserSession(request);
      if (!userSession) {
        return NextResponse.json(
          { error: 'Unauthorized: Sesi login tidak valid. Silakan login kembali.' },
          { status: 401 }
        );
      }

      const sessionEmail = userSession.email.toLowerCase().trim();
      const ownerEmail = existingOrder.customerEmail?.toLowerCase()?.trim();

      if (sessionEmail !== ownerEmail) {
        return NextResponse.json(
          { error: 'Forbidden: Anda tidak memiliki izin untuk memodifikasi pesanan pelanggan lain.' },
          { status: 403 }
        );
      }

      // STRICT STATUS TRANSITION RULES FOR CUSTOMERS (Anti-Status Tampering)
      if (updatedOrder.status === 'Cancelled') {
        if (existingOrder.status !== 'Pending') {
          return NextResponse.json(
            { error: 'Pesanan yang sedang diproses atau sudah dikirim tidak dapat dibatalkan secara sepihak.' },
            { status: 400 }
          );
        }
      } else if (updatedOrder.status === 'Delivered') {
        if (existingOrder.status !== 'Shipped') {
          return NextResponse.json(
            { error: 'Hanya pesanan yang sedang dalam pengiriman yang dapat ditandai telah tiba.' },
            { status: 400 }
          );
        }
      } else if (updatedOrder.status === 'Completed') {
        if (existingOrder.status !== 'Delivered' && existingOrder.status !== 'Shipped') {
          return NextResponse.json(
            { error: 'Hanya pesanan yang telah dikirim atau tiba yang dapat dikonfirmasi selesai.' },
            { status: 400 }
          );
        }
      } else if (updatedOrder.status !== existingOrder.status) {
        return NextResponse.json(
          { error: 'Forbidden: Status pesanan ini hanya dapat dikonfirmasi oleh sistem pembayaran gateway resmi atau Administrator.' },
          { status: 403 }
        );
      }

      // Customers CANNOT modify tracking number, courier, or total amounts
      if (updatedOrder.trackingNumber && updatedOrder.trackingNumber !== existingOrder.trackingNumber) {
        return NextResponse.json(
          { error: 'Unauthorized: Nomor resi pengiriman hanya dapat diatur oleh Admin.' },
          { status: 403 }
        );
      }
    }

    // Always update local storage in db.json for resilience
    try {
      const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
      if (fs.existsSync(dbPath)) {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (Array.isArray(dbData.orders)) {
          const idx = dbData.orders.findIndex((o: any) => o.id === updatedOrder.id);
          if (idx !== -1) {
            dbData.orders[idx] = {
              ...dbData.orders[idx],
              status: updatedOrder.status,
              trackingNumber: isAdmin ? (updatedOrder.trackingNumber ?? dbData.orders[idx].trackingNumber) : dbData.orders[idx].trackingNumber,
              courier: isAdmin ? (updatedOrder.courier ?? dbData.orders[idx].courier) : dbData.orders[idx].courier
            };
            fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
          }
        }
      }
    } catch (fsErr) {
      console.warn("Could not sync update to db.json:", fsErr);
    }

    // Attempt PostgreSQL update via Prisma if available
    let order: any = null;
    try {
      order = await prisma.order.update({
        where: { id: updatedOrder.id },
        data: {
          status: updatedOrder.status,
          trackingNumber: isAdmin ? updatedOrder.trackingNumber : existingOrder.trackingNumber,
          courier: isAdmin ? updatedOrder.courier : existingOrder.courier
        },
        include: { items: true }
      });
    } catch (_e) {
      // Prisma offline, proceed with local update
    }

    const finalOrder = order ? { ...order, date: order.createdAt } : {
      ...existingOrder,
      status: updatedOrder.status,
      trackingNumber: isAdmin ? (updatedOrder.trackingNumber ?? existingOrder.trackingNumber) : existingOrder.trackingNumber,
      courier: isAdmin ? (updatedOrder.courier ?? existingOrder.courier) : existingOrder.courier,
      date: existingOrder.date || existingOrder.createdAt || new Date().toISOString()
    };

    // Notify customer if status changes
    if (finalOrder.customerEmail) {
      try {
        if (updatedOrder.status === 'Processing') {
          await prisma.notification.create({
            data: {
              userEmail: finalOrder.customerEmail,
              title: "Pesanan Diproses",
              desc: `Hore! Pembayaran untuk pesanan ${finalOrder.id} telah dikonfirmasi dan pesanan sedang disiapkan.`,
              href: "/dashboard/orders"
            }
          }).catch(() => {});
        } else if (updatedOrder.status === 'Shipped') {
          await prisma.notification.create({
            data: {
              userEmail: finalOrder.customerEmail,
              title: "Pesanan Dikirim",
              desc: `Pesanan ${finalOrder.id} telah dikirim dengan resi ${updatedOrder.trackingNumber || '-'}`,
              href: "/dashboard/orders"
            }
          }).catch(() => {});
        } else if (updatedOrder.status === 'Delivered') {
          await prisma.notification.create({
            data: {
              userEmail: finalOrder.customerEmail,
              title: "Pesanan Tiba",
              desc: `Pesanan ${finalOrder.id} telah tiba di tujuan. Mohon fotokan paket saat tiba/unboxing sebagai bukti bahwa produk sesuai pesanan, lalu konfirmasi selesai.`,
              href: "/dashboard/orders"
            }
          }).catch(() => {});
        }
      } catch (_e) {}
    }

    return NextResponse.json({ 
      message: 'Order updated successfully', 
      order: finalOrder 
    });
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
