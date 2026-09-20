import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // iPay88 sends webhook data as x-www-form-urlencoded
    const formData = await req.formData();
    
    const merchantCode = formData.get("MerchantCode")?.toString() || "";
    const paymentId = formData.get("PaymentId")?.toString() || "";
    const refNo = formData.get("RefNo")?.toString() || "";
    const amount = formData.get("Amount")?.toString() || "";
    const currency = formData.get("Currency")?.toString() || "";
    const status = formData.get("Status")?.toString() || "";
    const signature = formData.get("Signature")?.toString() || "";
    
    const expectedMerchantCode = process.env.IPAY88_MERCHANT_CODE;
    const merchantKey = process.env.IPAY88_MERCHANT_KEY;

    if (!expectedMerchantCode || expectedMerchantCode === "IDXXXXX") {
      console.warn("Webhook received but IPAY88_MERCHANT_CODE is not set.");
      // For dummy testing, we'll just accept it
    } else {
      // Real iPay88 Signature Validation
      // Signature formula: SHA256(MerchantKey + MerchantCode + PaymentId + RefNo + Amount + Currency + Status)
      const signatureAmount = amount.replace(/[.,]/g, '');
      const sourceStr = `${merchantKey}${merchantCode}${paymentId}${refNo}${signatureAmount}${currency}${status}`;
      
      const expectedSignature = crypto
        .createHash('sha256')
        .update(sourceStr)
        .digest('base64');
      
      if (expectedSignature !== signature) {
        return new NextResponse("Invalid signature", { status: 403 });
      }
    }

    // Update the order in PostgreSQL via Prisma
    if (status === '1') { // 1 is success in iPay88
      try {
        const updatedOrder = await prisma.order.update({
          where: { id: refNo },
          data: { status: 'Processing' }
        });

        // Notify Customer
        if (updatedOrder.customerEmail) {
          await prisma.notification.create({
            data: {
              userEmail: updatedOrder.customerEmail,
              title: "Pembayaran Dikonfirmasi! ☕",
              desc: `Pembayaran untuk pesanan ${refNo} telah berhasil dikonfirmasi. Biji kopi Anda sedang disiapkan oleh Barista Ramu.`,
              href: `/track?orderId=${refNo}`
            }
          });
        }

        // Notify Admin
        await prisma.notification.create({
          data: {
            userEmail: "admin@ramuroastery.com",
            title: "Pesanan Lunas (Siap Diproses)",
            desc: `Pesanan ${refNo} dari ${updatedOrder.customerName} telah lunas. Silakan siapkan batch sangrai dan packing.`,
            href: "/admin/orders"
          }
        });
      } catch (dbErr) {
        console.error("Failed to update order status in DB:", dbErr);
      }
    } else {
      try {
        await prisma.order.update({
          where: { id: refNo },
          data: { status: 'Cancelled' }
        });
      } catch (dbErr) {
        console.error("Failed to cancel unpaid order in DB:", dbErr);
      }
    }
    
    console.log(`[iPay88 Webhook] Order ${refNo} status is ${status === '1' ? 'Success' : 'Failed'}`);

    // iPay88 expects 'RECEIVEOK' as the response to stop re-sending the callback
    return new NextResponse("RECEIVEOK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Failed to process webhook", { status: 500 });
  }
}
