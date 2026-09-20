import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Failed to fetch all subscriptions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { id, action } = await req.json();
    
    if (action === "renew") {
      const subscription = await prisma.subscription.findUnique({ where: { id } });
      if (!subscription) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const newCompleted = (subscription.deliveriesCompleted || 0) + 1;
      const isCompleted = newCompleted >= (subscription.deliveriesTotal || 1);

      const newDate = new Date(subscription.nextDelivery);
      if (subscription.frequency === "1_WEEK") newDate.setDate(newDate.getDate() + 7);
      else if (subscription.frequency === "2_WEEKS") newDate.setDate(newDate.getDate() + 14);
      else if (subscription.frequency === "1_MONTH") newDate.setMonth(newDate.getMonth() + 1);

      const updated = await prisma.subscription.update({
        where: { id },
        data: { 
          nextDelivery: newDate, 
          deliveriesCompleted: newCompleted,
          status: isCompleted ? "Completed" : "Active" 
        }
      });

      // Deduct product stock from db.json and log to inventory
      try {
        const fs = await import('fs');
        const path = await import('path');
        const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
        if (fs.existsSync(dbPath)) {
          const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          const pIdx = dbData.products.findIndex((p: any) => p.id === subscription.productId);
          if (pIdx !== -1) {
            const gramsMatch = (subscription.variant || "").match(/(\d+)\s*(g|gram|kg)/i);
            let gramPerItem = 250;
            if (gramsMatch) {
              const val = Number(gramsMatch[1]);
              gramPerItem = gramsMatch[2].toLowerCase() === 'kg' ? val * 1000 : val;
            }
            const totalDeductGrams = gramPerItem * (subscription.quantity || 1);
            const currentStock = dbData.products[pIdx].stock || 0;
            const newStock = Math.max(0, currentStock - totalDeductGrams);
            dbData.products[pIdx].stock = newStock;
            fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));

            await prisma.inventoryLog.create({
              data: {
                productId: subscription.productId,
                productName: subscription.productName,
                changeAmount: -totalDeductGrams,
                newStock,
                type: "STOCK_OUT",
                notes: `Kirim Paket Langganan #${subscription.id} (Ke-${newCompleted}/${subscription.deliveriesTotal})`
              }
            });
          }
        }
      } catch (invErr) {
        console.error("Failed to deduct subscription inventory:", invErr);
      }

      // Send notification to user
      await prisma.notification.create({
        data: {
          userEmail: subscription.userEmail,
          title: "Paket Langganan Diproses! 🚚",
          desc: `Paket ${subscription.productName} (Pengiriman ke-${newCompleted} dari ${subscription.deliveriesTotal}) sedang diproses/dikirim. Jadwal berikutnya: ${newDate.toLocaleDateString('id-ID')}.`,
          href: "/dashboard/subscriptions"
        }
      });

      return NextResponse.json(updated);
    }

    if (action === "edit_date") {
      const { nextDelivery } = await req.json();
      if (!nextDelivery) return NextResponse.json({ error: "No date provided" }, { status: 400 });

      const newDate = new Date(nextDelivery);
      const updated = await prisma.subscription.update({
        where: { id },
        data: { nextDelivery: newDate }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to advance subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
