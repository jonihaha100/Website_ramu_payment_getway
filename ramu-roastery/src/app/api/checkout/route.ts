import { NextRequest, NextResponse } from "next/server";
import { CheckoutPayload } from "../../../types/cart";
import prisma from "../../../lib/prisma";
import { coffees } from "../../../data/coffees";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Helper to snap next delivery strictly to Ramu Roastery scheduled batch days (Monday = 1, Thursday = 4)
function getNextRoastBatchDate(startDate: Date, daysToAdd: number = 7): Date {
  const result = new Date(startDate);
  result.setDate(result.getDate() + daysToAdd);
  result.setHours(9, 0, 0, 0);
  
  // Snap forward until Monday (1) or Thursday (4)
  while (result.getDay() !== 1 && result.getDay() !== 4) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutPayload = await req.json();
    
    // Validate request
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    
    // Generate cryptographically secure, non-enumerable order ID (Anti-Scraping / Anti-Enumeration)
    // Format: RAMU-YYYYMM-XXXXXXXX (4.2+ billion combinations per month)
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderId = `RAMU-${datePrefix}-${randomSuffix}`;

    // Check if user is VIP Subscriber (has active subscription or currently purchasing a subscription)
    const hasSubscriptionInCart = body.items.some(item => item.isSubscription);
    let isVipUser = hasSubscriptionInCart;
    
    if (!isVipUser && body.customer?.email) {
      try {
        const activeSub = await prisma.subscription.findFirst({
          where: { userEmail: body.customer.email.toLowerCase().trim(), status: "Active" }
        });
        if (activeSub) isVipUser = true;
      } catch (_e) {}
    }

    // 1. SERVER-SIDE STRICT ITEM & PRICE VALIDATION (Anti-Tampering)
    let validatedItemsTotal = 0;
    const validatedItems = [];

    for (const item of body.items) {
      if (!item.quantity || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        return NextResponse.json({ error: `Kuantitas produk tidak valid untuk item ${item.name}` }, { status: 400 });
      }

      const foundCoffee = coffees.find(c => c.id === item.productId || c.id === item.id);
      if (!foundCoffee) {
        return NextResponse.json({ error: `Produk tidak terdaftar di katalog resmi: ${item.name}` }, { status: 400 });
      }

      const weight = item.weight || 250;
      let unitPrice = 0;
      if (foundCoffee.prices && foundCoffee.prices[weight]) {
        unitPrice = foundCoffee.prices[weight];
      } else {
        unitPrice = Math.round((foundCoffee.pricePerKg * weight) / 1000);
      }

      // If item is subscription, apply official package discount (10% on 4x, 15% on 12x)
      let itemFinalPrice = unitPrice;
      if (item.isSubscription && item.deliveriesTotal) {
        const subDiscountRate = item.deliveriesTotal >= 12 ? 0.85 : 0.9;
        itemFinalPrice = Math.round(unitPrice * item.deliveriesTotal * subDiscountRate);
      }

      validatedItemsTotal += itemFinalPrice * item.quantity;

      const grindLabel = item.grind || "Biji Utuh";
      const weightLabel = weight >= 1000 ? `${weight / 1000}kg` : `${weight}g`;
      const fullVariantName = `${item.name} (${weightLabel} • ${grindLabel})`;

      validatedItems.push({
        id: item.id,
        productId: foundCoffee.id,
        name: fullVariantName,
        baseName: item.name,
        quantity: item.quantity,
        price: itemFinalPrice,
        weight: weight,
        grind: grindLabel,
        isSubscription: item.isSubscription,
        frequency: item.frequency,
        deliveriesTotal: item.deliveriesTotal,
      });
    }

    // 2. SERVER-SIDE PROMO CODE VALIDATION (Anti-Discount Tampering)
    // Never trust body.discount from client!
    let promoDiscountAmount = 0;
    let verifiedPromoCode: string | null = null;
    if (body.promoCode) {
      const cleanCode = body.promoCode.toUpperCase().trim();
      try {
        const promo = await prisma.promoCode.findUnique({
          where: { code: cleanCode }
        });

        if (promo && promo.isActive) {
          const notExpired = !promo.validUntil || new Date(promo.validUntil).getTime() >= Date.now();
          const quotaAvailable = !promo.maxUses || promo.usedCount < promo.maxUses;

          if (notExpired && quotaAvailable) {
            verifiedPromoCode = promo.code;
            if (promo.discountType === 'percentage') {
              const pct = Math.min(100, Math.max(0, promo.discountValue));
              promoDiscountAmount = Math.round(validatedItemsTotal * (pct / 100));
            } else {
              promoDiscountAmount = Math.min(validatedItemsTotal, Math.max(0, promo.discountValue));
            }
          }
        }
      } catch (err) {
        console.error("Promo verification error:", err);
      }
    }

    // 3. SERVER-SIDE POINTS VALIDATION (Anti-Points Tampering)
    let pointsDiscount = 0;
    let validatedRedeemPoints = 0;
    const requestedPoints = Number(body.redeemPoints) || 0;
    if (requestedPoints > 0 && body.customer?.email) {
      try {
        const userPoints = await prisma.ramuPoints.findMany({
          where: { userEmail: body.customer.email.toLowerCase().trim() }
        });
        const balance = userPoints.reduce((sum, r) => sum + r.amount, 0);
        if (balance >= requestedPoints) {
          const maxPointsRedeemable = Math.floor(Math.max(0, validatedItemsTotal - promoDiscountAmount) / 100);
          validatedRedeemPoints = Math.min(requestedPoints, maxPointsRedeemable);
          pointsDiscount = validatedRedeemPoints * 100; // 1 point = Rp 100
        }
      } catch (err) {
        console.error("Points verification error:", err);
      }
    }

    // 4. SERVER-SIDE B2B DISCOUNT VALIDATION
    let b2bDiscountAmount = 0;
    if (body.customer?.email) {
      try {
        const userRec = await prisma.user.findUnique({
          where: { email: body.customer.email.toLowerCase().trim() }
        });
        if (userRec && userRec.role?.toUpperCase() === 'B2B') {
          const totalGrams = body.items.reduce((sum, it) => sum + ((it.weight || 250) * it.quantity), 0);
          if (totalGrams >= 5000) {
            b2bDiscountAmount = Math.round(validatedItemsTotal * 0.15); // 15% wholesale discount
          }
        }
      } catch (err) {
        console.error("B2B verification error:", err);
      }
    }
    
    // VIP Benefit: Admin fee is completely FREE (Rp 0) for active VIP / subscribers!
    const finalAdminFee = isVipUser ? 0 : Math.max(0, body.adminFee || 2500);
    const finalShippingCost = (body as any).isTebengKirim ? 0 : Math.max(0, body.shippingCost || 0);

    const subtotalAfterDiscounts = Math.max(0, validatedItemsTotal - b2bDiscountAmount - promoDiscountAmount - pointsDiscount);
    const calculatedTotal = subtotalAfterDiscounts + Math.max(0, body.tax || 0) + finalAdminFee + finalShippingCost;

    // ANTI-FREE EXPLOIT GUARD: Total must not be Rp 0 unless genuine 100% voucher covers the items
    if (calculatedTotal <= 0 && validatedItemsTotal > 0 && promoDiscountAmount < validatedItemsTotal) {
      return NextResponse.json({ error: "Perhitungan total tagihan tidak valid." }, { status: 400 });
    }

    const newOrder = {
      id: orderId,
      customerName: `${body.customer.firstName} ${body.customer.lastName}`.trim(),
      customerEmail: body.customer.email.toLowerCase().trim(),
      customerPhone: body.customer.phone,
      status: 'Pending',
      date: new Date().toISOString(),
      total: calculatedTotal,
      adminFee: finalAdminFee,
      tax: body.tax || 0,
      shippingCost: finalShippingCost,
      items: validatedItems,
      shippingAddress: `${body.customer.address}, Kel. ${body.customer.village || '-'}, Kec. ${body.customer.subdistrict || '-'}, ${body.customer.city}, ${body.customer.province || '-'}, ${body.customer.postalCode}`
    };

    // Save to PostgreSQL via Prisma
    try {
      const user = await prisma.user.findUnique({
        where: { email: body.customer.email }
      });

      await prisma.order.create({
        data: {
          id: orderId,
          customerName: newOrder.customerName,
          customerEmail: newOrder.customerEmail,
          customerPhone: newOrder.customerPhone,
          shippingAddress: newOrder.shippingAddress,
          total: newOrder.total,
          adminFee: newOrder.adminFee,
          tax: newOrder.tax,
          shippingCost: newOrder.shippingCost,
          status: newOrder.status,
          userId: user?.id,
          items: {
            create: validatedItems.map(item => ({
              productId: item.productId,
              name: item.name, // Full variant name: e.g. "Fullwash Gn. Halu (150g • Biji Utuh)"
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      });
      console.log(`Order ${orderId} saved to database with full item details`);
      
      // Handle Secure Point Redemption (Backend Verification)
      if (validatedRedeemPoints > 0) {
        await prisma.ramuPoints.create({
          data: {
            userEmail: newOrder.customerEmail,
            amount: -validatedRedeemPoints,
            type: "REDEEMED",
            orderId: orderId,
            note: `Penukaran ${validatedRedeemPoints} poin untuk pesanan ${orderId}`
          }
        });
      }

      // Handle Subscriptions (Locked strictly to Monday/Thursday batch schedule)
      for (const item of validatedItems) {
        if (item.isSubscription && item.frequency) {
          const daysToAdd = item.frequency === "1_WEEK" ? 7 : item.frequency === "2_WEEKS" ? 14 : 28;
          const nextDelivery = getNextRoastBatchDate(new Date(), daysToAdd);

          await prisma.subscription.create({
            data: {
              userEmail: newOrder.customerEmail,
              productId: item.productId,
              productName: item.baseName,
              variant: `${item.weight >= 1000 ? item.weight/1000 + 'kg' : item.weight + 'g'} - ${item.grind}`,
              quantity: item.quantity,
              price: item.price,
              frequency: item.frequency,
              deliveriesTotal: item.deliveriesTotal || 4,
              deliveriesCompleted: 1, // First shipment prepared with this order
              status: "Active",
              nextDelivery: nextDelivery
            }
          });
          console.log(`Subscription created for ${newOrder.customerEmail} with next delivery on batch day: ${nextDelivery.toISOString()}`);
        }
      }
      
      // Update Promo Code used count (strictly for verified codes)
      if (verifiedPromoCode) {
        try {
          await prisma.promoCode.update({
            where: { code: verifiedPromoCode },
            data: { usedCount: { increment: 1 } }
          });
        } catch (e) {
          console.error("Failed to update promo code used count", e);
        }
      }

      // Handle Inventory Logging & Stock Deduction
      try {
        const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
        let dbData = null;
        if (fs.existsSync(dbPath)) {
          const fileContents = fs.readFileSync(dbPath, 'utf8');
          dbData = JSON.parse(fileContents);
        }

        for (const item of body.items) {
          let newStock = 0;
          // Deduct from db.json if exists
          if (dbData && dbData.products) {
            // Match using productId instead of item.id (since item.id is variant-specific)
            const baseProductId = item.productId || item.id;
            const productIndex = dbData.products.findIndex((c: any) => c.id === baseProductId);
            if (productIndex !== -1) {
              const currentStock = dbData.products[productIndex].stock || 0;
              const weightInGrams = item.weight || 250;
              const totalGramsToDeduct = item.quantity * weightInGrams;
              
              if (currentStock < totalGramsToDeduct) {
                throw new Error(`Out of stock: ${item.name} (Need ${totalGramsToDeduct}g, available ${currentStock}g)`);
              }
              
              newStock = currentStock - totalGramsToDeduct;
              dbData.products[productIndex].stock = newStock;
              
              console.log(`Deducted ${totalGramsToDeduct}g from ${baseProductId}. New stock: ${newStock}g`);
            }
          }

          // Create Inventory Log
          await prisma.inventoryLog.create({
            data: {
              productId: item.id,
              productName: item.name,
              changeAmount: -(item.quantity * (item.weight || 250)),
              newStock: newStock,
              type: "SALE",
              notes: `Order ${orderId}`
            }
          });
        }

        // Save db.json
        if (dbData) {
          fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
        }
      } catch (e) {
        console.error("Failed to handle inventory logic", e);
      }

      // Notify Admin
      try {
        await prisma.notification.create({
          data: {
            userEmail: "admin@ramuroastery.com",
            title: "Pesanan Baru",
            desc: `Order ${orderId} dari ${newOrder.customerName} (Rp ${newOrder.total.toLocaleString("id-ID")})`,
            href: "/admin/orders"
          }
        });
      } catch (e) {
        console.error("Failed to notify admin", e);
      }

      // Auto-earn Ramu Points is now MOVED to /api/orders/route.ts 
      // It will only be granted when the order status is "Delivered" to prevent Refund Fraud.
    } catch (e) {
      console.error("Failed to save to database", e);
      return NextResponse.json({ error: "Database error while saving order" }, { status: 500 });
    }

    // Simulate network delay for realism if not using real API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // IPAY88 INTEGRATION
    const merchantCode = process.env.IPAY88_MERCHANT_CODE;
    const merchantKey = process.env.IPAY88_MERCHANT_KEY;
    
    if (merchantCode && merchantCode !== "IDXXXXX" && merchantKey) {
      try {
        const refNo = orderId;
        const amount = (Math.round(newOrder.total * 100) / 100).toFixed(2); // e.g., "50000.00"
        const currency = "IDR";
        
        // Remove . and , from amount for signature
        const signatureAmount = amount.replace(/[.,]/g, '');
        
        const sourceStr = `${merchantKey}${merchantCode}${refNo}${signatureAmount}${currency}`;
        
        // iPay88 signature (Base64)
        const signatureBase64 = crypto.createHash('sha256').update(sourceStr).digest('base64');
        
        const baseUrl = req.headers.get('origin') || "http://localhost:3000";

        // Return fields for frontend to build and submit the form
        return NextResponse.json({ 
          paymentType: "ipay88",
          orderId,
          fields: {
            MerchantCode: merchantCode,
            PaymentId: "", // Leave empty for selection page
            RefNo: refNo,
            Amount: amount,
            Currency: currency,
            ProdDesc: "Ramu Roastery Coffee",
            UserName: body.customer.firstName + " " + body.customer.lastName,
            UserEmail: body.customer.email,
            UserContact: body.customer.phone || "",
            Remark: "",
            Lang: "UTF-8",
            SignatureType: "SHA256",
            Signature: signatureBase64,
            ResponseURL: `${baseUrl}/checkout`, // Redirect back to checkout on success/fail for simplicity, or a dedicated success page
            BackendURL: `${baseUrl}/api/payment/webhook` 
          },
          actionUrl: "https://sandbox.ipay88.co.id/epayment/entry.asp",
          message: "Transaction created successfully" 
        });

      } catch (ipay88Error) {
        console.error("iPay88 Error:", ipay88Error);
        return NextResponse.json({ error: "Failed to create payment data" }, { status: 500 });
      }
    }

    // FALLBACK TO DUMMY MODE if no keys
    console.warn("Using Dummy Checkout (IPAY88_MERCHANT_CODE not set)");
    return NextResponse.json({ 
      paymentType: "dummy",
      token: "dummy_token_12345", 
      orderId,
      message: "Transaction created successfully (Dummy)" 
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
