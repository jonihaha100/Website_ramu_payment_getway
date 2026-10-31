import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import fs from 'fs';
import path from 'path';

function getDbFallbackData() {
  try {
    const dbPath = path.join(process.cwd(), 'src/data/db.json');
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
  } catch (err) {
    console.error("Failed to read fallback db.json in dashboard API:", err);
  }
  return { orders: [], reviews: [], products: [] };
}

export async function GET(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const now = new Date();
    
    // Start of Current Month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Start of Last Month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // End of Last Month
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    let pendingOrdersCount = 0;
    let recentReviews: any[] = [];
    let currentMonthOrders: any[] = [];
    let lastMonthOrders: any[] = [];
    let recentOrders: any[] = [];
    let lowStockProducts: any[] = [];

    let fetchedFromPrisma = false;
    try {
      const [
        prismaPendingCount,
        prismaRecentReviews,
        prismaCurrentMonthOrders,
        prismaLastMonthOrders,
        prismaRecentOrders
      ] = await Promise.all([
        prisma.order.count({
          where: { status: 'Pending' }
        }),
        prisma.review.findMany({
          orderBy: { createdAt: 'desc' },
          take: 3
        }),
        prisma.order.findMany({
          where: {
            createdAt: { gte: startOfCurrentMonth },
            status: { notIn: ['Cancelled', 'Pending'] }
          },
          include: { items: true }
        }),
        prisma.order.findMany({
          where: {
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
            status: { notIn: ['Cancelled', 'Pending'] }
          }
        }),
        prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      pendingOrdersCount = prismaPendingCount;
      recentReviews = prismaRecentReviews;
      currentMonthOrders = prismaCurrentMonthOrders;
      lastMonthOrders = prismaLastMonthOrders;
      recentOrders = prismaRecentOrders;
      fetchedFromPrisma = true;
    } catch (dbErr) {
      console.warn("Notice: Prisma dashboard fetch deferred, calculating from local db.json:", dbErr instanceof Error ? dbErr.message : dbErr);
    }

    if (!fetchedFromPrisma) {
      const dbData = getDbFallbackData();
      const allOrders = (dbData.orders || []).map((o: any) => ({
        ...o,
        createdAt: o.createdAt ? new Date(o.createdAt) : (o.date ? new Date(o.date) : new Date()),
        items: o.items || []
      }));

      pendingOrdersCount = allOrders.filter((o: any) => (o.status || '').toLowerCase() === 'pending').length;

      recentReviews = (dbData.reviews || []).slice(0, 3).map((r: any) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
      }));

      currentMonthOrders = allOrders.filter((o: any) => {
        const orderDate = new Date(o.createdAt);
        const status = (o.status || '').toLowerCase();
        return orderDate >= startOfCurrentMonth && status !== 'cancelled' && status !== 'pending';
      });

      lastMonthOrders = allOrders.filter((o: any) => {
        const orderDate = new Date(o.createdAt);
        const status = (o.status || '').toLowerCase();
        return orderDate >= startOfLastMonth && orderDate <= endOfLastMonth && status !== 'cancelled' && status !== 'pending';
      });

      recentOrders = allOrders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      if (dbData.products && Array.isArray(dbData.products)) {
        lowStockProducts = dbData.products
          .filter((p: any) => typeof p.stock === 'number' && p.stock < 10)
          .slice(0, 5);
      }
    }

    // 2. KPIs (Current vs Last Month)
    const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const lastRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const currentOrdersCount = currentMonthOrders.length;
    const lastOrdersCount = lastMonthOrders.length;

    const currentCustomers = new Set(currentMonthOrders.map(o => o.userId || o.customerEmail)).size;
    const lastCustomers = new Set(lastMonthOrders.map(o => o.userId || o.customerEmail)).size;

    // 3. Top Products (From current month orders, or fallback to recent orders)
    const ordersForTop = currentMonthOrders.length > 0 ? currentMonthOrders : (recentOrders || []);
    const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {};
    
    ordersForTop.forEach(order => {
      (order.items || []).forEach((item: any) => {
        const prodId = item.productId || item.id || item.name;
        if (!productSales[prodId]) {
          productSales[prodId] = { name: item.name || 'Unknown Product', quantity: 0, revenue: 0 };
        }
        productSales[prodId].quantity += (item.quantity || 1);
        productSales[prodId].revenue += ((item.price || 0) * (item.quantity || 1));
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return NextResponse.json({
      alerts: {
        pendingOrdersCount,
        lowStockProducts,
        recentReviews
      },
      kpi: {
        revenue: { current: currentRevenue, last: lastRevenue },
        orders: { current: currentOrdersCount, last: lastOrdersCount },
        customers: { current: currentCustomers, last: lastCustomers }
      },
      topProducts,
      recentOrders
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
