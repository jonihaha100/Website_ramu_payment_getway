import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  return handleCleanup(req);
}

export async function GET(req: NextRequest) {
  return handleCleanup(req);
}

async function handleCleanup(req: NextRequest) {
  try {
    // 24 hours threshold
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find all unpaid orders older than 24 hours
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "Pending",
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      include: {
        items: true,
      },
    });

    if (expiredOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired pending orders found",
        cancelledCount: 0,
      });
    }

    const fs = await import("fs");
    const path = await import("path");
    const dbPath = path.join(process.cwd(), "src", "data", "db.json");

    let dbData: any = null;
    let hasDbFile = false;
    if (fs.existsSync(dbPath)) {
      try {
        dbData = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        hasDbFile = true;
      } catch (err) {
        console.error("Could not parse db.json during order cleanup:", err);
      }
    }

    let restoredItemsCount = 0;

    for (const order of expiredOrders) {
      // 1. Mark order as Cancelled (Expired)
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "Cancelled" },
      });

      // 2. Restore physical stock for each item
      for (const item of order.items) {
        const gramsMatch = item.name.match(/(\d+)\s*(g|gram|kg)/i);
        let gramPerItem = 250;
        if (gramsMatch) {
          const val = Number(gramsMatch[1]);
          gramPerItem = gramsMatch[2].toLowerCase() === "kg" ? val * 1000 : val;
        }

        const totalRestoreGrams = gramPerItem * item.quantity;

        // Restore in db.json if product exists
        if (hasDbFile && dbData?.products) {
          const productIdx = dbData.products.findIndex(
            (p: any) => p.id === item.productId || p.name === item.name.split(" (")[0]
          );

          if (productIdx !== -1) {
            const currentStock = dbData.products[productIdx].stock || 0;
            const newStock = currentStock + totalRestoreGrams;
            dbData.products[productIdx].stock = newStock;
            restoredItemsCount++;

            // Create InventoryLog in Prisma
            try {
              await prisma.inventoryLog.create({
                data: {
                  productId: dbData.products[productIdx].id,
                  productName: dbData.products[productIdx].name,
                  changeAmount: totalRestoreGrams,
                  newStock: newStock,
                  type: "STOCK_IN",
                  notes: `Auto-restock from cancelled unpaid order ${order.id}`,
                },
              });
            } catch (logErr) {
              console.warn("Could not create InventoryLog entry:", logErr);
            }
          }
        }
      }

      // 3. Notify customer about the order cancellation
      if (order.customerEmail) {
        try {
          await prisma.notification.create({
            data: {
              userEmail: order.customerEmail,
              title: "Pesanan Dibatalkan Otomatis",
              desc: `Batas waktu pembayaran 24 jam untuk pesanan ${order.id} telah berakhir. Stok produk telah dikembalikan ke inventaris roastery.`,
              href: `/dashboard/orders`,
            },
          });
        } catch (notifErr) {
          console.warn("Could not create cancellation notification:", notifErr);
        }
      }
    }

    // Save updated db.json
    if (hasDbFile && dbData) {
      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cancelled ${expiredOrders.length} expired orders and restored stock`,
      cancelledCount: expiredOrders.length,
      restoredItemsCount,
    });
  } catch (error: any) {
    console.error("Failed to run order cleanup:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
