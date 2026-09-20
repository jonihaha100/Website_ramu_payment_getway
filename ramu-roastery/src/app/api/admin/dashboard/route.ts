import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';

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

    // Use Promise.all to fetch all independent queries concurrently
    const [
      pendingOrdersCount,
      recentReviews,
      currentMonthOrders,
      lastMonthOrders,
      recentOrders
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
          status: { notIn: ['Cancelled', 'Pending'] } // only valid revenue
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

    // Currently there is no Product model in Prisma, stock is tracked via InventoryLog or static.
    // For now, we return an empty array to prevent crash.
    const lowStockProducts: any[] = [];

    // 2. KPIs (Current vs Last Month)
    const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const lastRevenue = lastMonthOrders.reduce((sum, o) => sum + o.total, 0);

    const currentOrdersCount = currentMonthOrders.length;
    const lastOrdersCount = lastMonthOrders.length;

    const currentCustomers = new Set(currentMonthOrders.map(o => o.userId || o.customerEmail)).size;
    const lastCustomers = new Set(lastMonthOrders.map(o => o.userId || o.customerEmail)).size;

    // 3. Top Products (From current month orders)
    const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {};
    
    currentMonthOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += (item.price * item.quantity);
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
