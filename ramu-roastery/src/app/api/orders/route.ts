import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { mockOrders } from '../../../data/mockOrders';
import { requireAdmin } from '../../../lib/auth';

// In-memory cache fallback to prevent crashes during database network latency
let cachedOrders: any[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('customerEmail') || searchParams.get('email');
    const search = searchParams.get('search') || searchParams.get('orderId') || searchParams.get('resi');

    // 1. Single Order or Tracking Number lookup (for Order Tracking page)
    if (search) {
      const cleanSearch = search.trim();
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: { equals: cleanSearch, mode: 'insensitive' } },
            { trackingNumber: { equals: cleanSearch, mode: 'insensitive' } }
          ]
        },
        include: { items: true }
      });
      if (order) {
        return NextResponse.json([{ ...order, date: order.createdAt }]);
      }
      return NextResponse.json([]);
    }

    // 2. Filter by specific customer email (for Customer Dashboard)
    if (customerEmail) {
      const orders = await prisma.order.findMany({
        where: {
          customerEmail: customerEmail.toLowerCase().trim()
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      });
      const mapped = orders.map(order => ({ ...order, date: order.createdAt }));
      return NextResponse.json(mapped);
    }

    // 3. Fetching ALL orders: STRICTLY requires Admin Session to protect user privacy (Anti-IDOR / Anti-Scraping)
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const orders = await prisma.order.findMany({
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    const mappedOrders = orders.map(order => ({
      ...order,
      date: order.createdAt
    }));
    cachedOrders = mappedOrders;
    return NextResponse.json(mappedOrders);
  } catch (error) {
    console.warn("Database notice: orders query failed or timed out, serving cached/mock fallback:", error instanceof Error ? error.message : error);
    if (cachedOrders && cachedOrders.length > 0) {
      return NextResponse.json(cachedOrders);
    }
    return NextResponse.json(mockOrders);
  }
}

export async function PUT(request: Request) {
  try {
    const updatedOrder = await request.json();
    if (!updatedOrder.id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    const existingOrder = await prisma.order.findUnique({
      where: { id: updatedOrder.id }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security Check: Verify if caller is Admin or the customer who owns this order
    const adminCheck = await requireAdmin(request);
    const isAdmin = !adminCheck;

    if (!isAdmin) {
      const callerEmail = updatedOrder.customerEmail?.toLowerCase()?.trim();
      const ownerEmail = existingOrder.customerEmail?.toLowerCase()?.trim();

      if (!callerEmail || callerEmail !== ownerEmail) {
        return NextResponse.json(
          { error: 'Unauthorized: Anda tidak memiliki izin untuk memodifikasi pesanan ini.' },
          { status: 403 }
        );
      }

      // Customers cannot tamper with courier or tracking number
      if (updatedOrder.trackingNumber && updatedOrder.trackingNumber !== existingOrder.trackingNumber) {
        return NextResponse.json(
          { error: 'Unauthorized: Nomor resi pengiriman hanya dapat diatur oleh Admin.' },
          { status: 403 }
        );
      }
    }

    const order = await prisma.order.update({
      where: { id: updatedOrder.id },
      data: {
        status: updatedOrder.status,
        trackingNumber: isAdmin ? updatedOrder.trackingNumber : existingOrder.trackingNumber,
        courier: isAdmin ? updatedOrder.courier : existingOrder.courier
      },
      include: { items: true }
    });

    // Notify customer if status changes
    if (order.customerEmail) {
      try {
        if (updatedOrder.status === 'Processing') {
          await prisma.notification.create({
            data: {
              userEmail: order.customerEmail,
              title: "Pesanan Diproses",
              desc: `Hore! Pembayaran untuk pesanan ${order.id} telah dikonfirmasi dan pesanan sedang disiapkan.`,
              href: "/dashboard/orders"
            }
          });
        } else if (updatedOrder.status === 'Shipped') {
          await prisma.notification.create({
            data: {
              userEmail: order.customerEmail,
              title: "Pesanan Dikirim",
              desc: `Pesanan ${order.id} telah dikirim dengan resi ${updatedOrder.trackingNumber || '-'}`,
              href: "/dashboard/orders"
            }
          });
        } else if (updatedOrder.status === 'Delivered') {
          await prisma.notification.create({
            data: {
              userEmail: order.customerEmail,
              title: "Pesanan Tiba",
              desc: `Pesanan ${order.id} telah tiba di tujuan. Mohon fotokan paket saat tiba/unboxing sebagai bukti bahwa produk sesuai pesanan, lalu konfirmasi selesai.`,
              href: "/dashboard/orders"
            }
          });

          // Secure Auto-Earn Ramu Points (1 poin per Rp 10.000)
          const earnedPoints = Math.floor(existingOrder.total / 10000);
          if (earnedPoints > 0) {
            const existingPoints = await prisma.ramuPoints.findFirst({
              where: { orderId: order.id, type: 'EARNED' }
            });

            if (!existingPoints) {
              await prisma.ramuPoints.create({
                data: {
                  userEmail: order.customerEmail,
                  amount: earnedPoints,
                  type: "EARNED",
                  orderId: order.id,
                  note: `Belanja Rp ${existingOrder.total.toLocaleString("id-ID")} → ${earnedPoints} poin (Terkirim)`
                }
              });
              console.log(`Earned ${earnedPoints} points for order ${order.id}`);
            }
          }
        }
      } catch (e) {
        console.error("Failed to notify customer", e);
      }
    }

    return NextResponse.json({ 
      message: 'Order updated successfully', 
      order: { ...order, date: order.createdAt } 
    });
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
