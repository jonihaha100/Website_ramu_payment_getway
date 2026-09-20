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
    const webhookSecretToken = process.env.WEBHOOK_SECRET_TOKEN;

    // ANTI-BYPASS SECURITY CHECK: Reject all requests if no gateway key or valid test secret
    const hasValidGatewayKeys = expectedMerchantCode && expectedMerchantCode !== "IDXXXXX" && merchantKey;
    const incomingSecret = req.headers.get("x-webhook-secret");
    const hasValidTestSecret = webhookSecretToken && incomingSecret === webhookSecretToken;

    if (!hasValidGatewayKeys && !hasValidTestSecret) {
      console.error("[SECURITY] Webhook rejected: Payment gateway keys not configured and untrusted notification origin.");
      return new NextResponse("Unauthorized: Webhook signature or secret token required.", { status: 403 });
    }

    // Cryptographic Signature Validation
    if (hasValidGatewayKeys) {
      if (merchantCode !== expectedMerchantCode) {
        return new NextResponse("Forbidden: Invalid Merchant Code", { status: 403 });
      }

      // Formula: SHA256(MerchantKey + MerchantCode + PaymentId + RefNo + Amount + Currency + Status)
      const signatureAmount = amount.replace(/[.,]/g, '');
      const sourceStr = `${merchantKey}${merchantCode}${paymentId}${refNo}${signatureAmount}${currency}${status}`;
      
      const expectedSignature = crypto
        .createHash('sha256')
        .update(sourceStr)
        .digest('base64');
      
      let signatureValid = false;
      if (signature && expectedSignature.length === signature.length) {
        signatureValid = crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
      }

      if (!signatureValid) {
        console.error(`[SECURITY ALERT] Invalid payment signature detected for order ${refNo}!`);
        return new NextResponse("Invalid signature", { status: 403 });
      }
    }

    // Verify order existence and amount consistency in PostgreSQL via Prisma
    const existingOrder = await prisma.order.findUnique({
      where: { id: refNo }
    });

    if (!existingOrder) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // AMOUNT VERIFICATION: Prevent partial payment spoofing (e.g. paying Rp 100 for Rp 500.000)
    if (amount) {
      const paidAmount = parseFloat(amount.replace(/,/g, ''));
      if (!isNaN(paidAmount) && Math.abs(paidAmount - existingOrder.total) > 1.0) {
        console.error(`[SECURITY ALERT] Amount mismatch for order ${refNo}: Expected Rp ${existingOrder.total}, Got Rp ${paidAmount}`);
        return new NextResponse("Amount mismatch detected", { status: 400 });
      }
    }

    // Update the order status in PostgreSQL via Prisma
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
              desc: `Pembayaran untuk pesanan ${refNo} telah berhasil diverifikasi oleh payment gateway. Biji kopi Anda sedang disiapkan oleh Barista Ramu.`,
              href: `/track?orderId=${refNo}`
            }
          });
        }

        // Notify Admin
        await prisma.notification.create({
          data: {
            userEmail: "admin@ramuroastery.com",
            title: "Pesanan Lunas (Resmi Gateway)",
            desc: `Pesanan ${refNo} dari ${updatedOrder.customerName} (Rp ${existingOrder.total.toLocaleString("id-ID")}) telah lunas terverifikasi. Silakan proses sangrai & packing.`,
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
    
    console.log(`[iPay88 Webhook Verified] Order ${refNo} status updated to ${status === '1' ? 'Processing (Paid)' : 'Cancelled'}`);

    // iPay88 expects 'RECEIVEOK' as the response to stop re-sending the callback
    return new NextResponse("RECEIVEOK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Failed to process webhook", { status: 500 });
  }
}
