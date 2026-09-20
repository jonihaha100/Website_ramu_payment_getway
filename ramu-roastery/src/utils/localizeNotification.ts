/**
 * Utility to localize notifications according to Japanese e-commerce standards (Rakuten Japan - rakuten.co.jp benchmark).
 * Formats notification titles, descriptions, and timestamps with polite Japanese business honorifics (丁寧語/謙譲語),
 * clean brackets 【】 for order IDs, and standard e-commerce terminology.
 */

export interface LocalizedNotification {
  title: string;
  desc: string;
}

export function localizeNotification(
  rawTitle: string,
  rawDesc: string,
  lang: string = "id"
): LocalizedNotification {
  if (lang === "id") {
    return { title: rawTitle, desc: rawDesc };
  }

  // Handle Japanese (Rakuten Standard)
  if (lang === "ja") {
    return localizeJapanese(rawTitle, rawDesc);
  }

  // Handle English
  if (lang === "en") {
    return localizeEnglish(rawTitle, rawDesc);
  }

  return { title: rawTitle, desc: rawDesc };
}

function localizeJapanese(title: string, desc: string): LocalizedNotification {
  let jaTitle = title;
  let jaDesc = desc;

  // Title Mapping
  const trimmedTitle = title.trim();
  if (trimmedTitle.includes("Update Status Pesanan") || trimmedTitle === "Status Pesanan") {
    jaTitle = "【Ramu】ご注文状況の更新";
  } else if (trimmedTitle.includes("Pesanan Diproses")) {
    jaTitle = "【Ramu】焙煎・発送準備中のお知らせ";
  } else if (trimmedTitle.includes("Pesanan Dikirim")) {
    jaTitle = "【Ramu】商品発送完了のお知らせ";
  } else if (trimmedTitle.includes("Pesanan Tiba")) {
    jaTitle = "【Ramu】商品お届け完了のお知らせ";
  } else if (trimmedTitle.includes("Pesanan Selesai")) {
    jaTitle = "【Ramu】お取引完了・レビューのお願い";
  } else if (trimmedTitle.includes("Pesanan Dibatalkan")) {
    jaTitle = "【Ramu】ご注文自動キャンセルのお知らせ";
  } else if (trimmedTitle.includes("Pembayaran Dikonfirmasi") || trimmedTitle.includes("Pembayaran Berhasil")) {
    jaTitle = "【Ramu】お支払い確認完了のお知らせ";
  } else if (trimmedTitle.includes("Pesanan Lunas")) {
    jaTitle = "【Ramu】決済完了（発送準備）";
  } else if (trimmedTitle.includes("Pesanan Baru") || trimmedTitle === "New Order Received") {
    jaTitle = "新規ご注文の受付";
  } else if (trimmedTitle.includes("Pengajuan Pengembalian Baru") || trimmedTitle.includes("Permintaan Retur Baru")) {
    jaTitle = "返品・交換申請の受付";
  } else if (trimmedTitle.includes("Status Retur Diperbarui") || trimmedTitle.includes("Update Retur")) {
    if (trimmedTitle.includes("Approved") || trimmedTitle.includes("Disetujui")) {
      jaTitle = "【承認】返品・交換申請が承認されました";
    } else if (trimmedTitle.includes("Rejected") || trimmedTitle.includes("Ditolak")) {
      jaTitle = "【案内】返品・交換申請について";
    } else if (trimmedTitle.includes("Resolved") || trimmedTitle.includes("Selesai")) {
      jaTitle = "【完了】返品・交換手続き完了";
    } else {
      jaTitle = "返品・交換ステータスの更新";
    }
  } else if (trimmedTitle.includes("Resi Retur Diperbarui")) {
    jaTitle = "返送用送り状番号の更新";
  } else if (trimmedTitle.includes("Paket Langganan Diproses")) {
    jaTitle = "【定期便】お届け商品の発送準備中 🚚";
  } else if (trimmedTitle.includes("Permintaan Custom Sourcing")) {
    jaTitle = "カスタムソーシング受付";
  } else if (trimmedTitle.includes("Low Stock Alert")) {
    jaTitle = "在庫僅少アラート";
  } else if (trimmedTitle.includes("New B2B Sample Request")) {
    jaTitle = "B2Bサンプル請求の受付";
  } else if (trimmedTitle.includes("New User Registered")) {
    jaTitle = "新規会員登録完了";
  }

  // Description Pattern Mapping

  // 1. Pesanan RAMU-XXXX Anda sekarang berstatus: Shipped/Delivered/Completed/Pending/Processing/Cancelled
  const statusMatch = desc.match(/Pesanan\s+([A-Za-z0-9-_]+)\s+Anda\s+sekarang\s+berstatus:\s*(\w+)/i);
  if (statusMatch) {
    const orderId = statusMatch[1];
    const status = statusMatch[2].toLowerCase();

    if (status.includes("deliver")) {
      jaDesc = `ご注文番号【${orderId}】のお荷物の配達が完了いたしました。`;
    } else if (status.includes("complete")) {
      jaDesc = `ご注文番号【${orderId}】のお取引が完了いたしました。ご利用誠にありがとうございました。`;
    } else if (status.includes("ship")) {
      jaDesc = `ご注文番号【${orderId}】のお荷物を発送いたしました。`;
    } else if (status.includes("proc")) {
      jaDesc = `ご注文番号【${orderId}】の焙煎・発送準備を開始いたしました。`;
    } else if (status.includes("pend")) {
      jaDesc = `ご注文番号【${orderId}】のお支払いをお待ちしております。`;
    } else if (status.includes("cancel")) {
      jaDesc = `ご注文番号【${orderId}】のご注文がキャンセルされました。`;
    } else {
      jaDesc = `ご注文番号【${orderId}】のステータスが更新されました。`;
    }
    return { title: jaTitle, desc: jaDesc };
  }

  // 2. Pembayaran untuk pesanan RAMU-XXXX telah dikonfirmasi dan pesanan sedang disiapkan
  const procMatch = desc.match(/Pembayaran\s+untuk\s+pesanan\s+([A-Za-z0-9-_]+)\s+telah\s+(?:berhasil\s+)?dikonfirmasi/i);
  if (procMatch) {
    const orderId = procMatch[1];
    jaDesc = `ご注文番号【${orderId}】のお支払いが確認できました。新鮮な珈琲豆の焙煎・発送準備を開始いたします。`;
    return { title: jaTitle, desc: jaDesc };
  }

  // 3. Pesanan RAMU-XXXX telah dikirim dengan resi TRACKING
  const shipMatch = desc.match(/Pesanan\s+([A-Za-z0-9-_]+)\s+telah\s+dikirim(?:\s+dengan\s+resi\s+(.*))?/i);
  if (shipMatch) {
    const orderId = shipMatch[1];
    const resi = shipMatch[2]?.trim() || "-";
    jaDesc = resi !== "-"
      ? `ご注文番号【${orderId}】のお荷物を発送いたしました。送り状伝票番号: ${resi}`
      : `ご注文番号【${orderId}】のお荷物を発送いたしました。`;
    return { title: jaTitle, desc: jaDesc };
  }

  // 4. Pesanan RAMU-XXXX telah tiba di tujuan
  const arriveMatch = desc.match(/Pesanan\s+([A-Za-z0-9-_]+)\s+telah\s+tiba\s+di\s+tujuan/i);
  if (arriveMatch) {
    const orderId = arriveMatch[1];
    jaDesc = `ご注文番号【${orderId}】のお荷物が到着いたしました。内容をご確認いただき、受取完了のお手続きをお願いいたします。`;
    return { title: jaTitle, desc: jaDesc };
  }

  // 5. Batas waktu pembayaran 24 jam untuk pesanan RAMU-XXXX telah berakhir
  const cancelMatch = desc.match(/Batas\s+waktu\s+pembayaran\s+24\s+jam\s+untuk\s+pesanan\s+([A-Za-z0-9-_]+)\s+telah\s+berakhir/i);
  if (cancelMatch) {
    const orderId = cancelMatch[1];
    jaDesc = `ご注文番号【${orderId}】のお支払い期限（24時間）が経過したため、自動キャンセルとなりました。在庫は元に戻されました。`;
    return { title: jaTitle, desc: jaDesc };
  }

  // 6. Status pengembalian pesanan RAMU-XXXX menjadi: Approved / Rejected / Resolved
  const returMatch = desc.match(/Status\s+pengembalian\s+pesanan\s+([A-Za-z0-9-_]+)\s+menjadi:\s*(\w+)/i);
  if (returMatch) {
    const orderId = returMatch[1];
    const st = returMatch[2].toLowerCase();
    if (st.includes("appr") || st.includes("setuju")) {
      jaDesc = `ご注文番号【${orderId}】の返品申請が承認されました。弊社ロースタリーまで着払いにてご返送ください。`;
    } else if (st.includes("rej") || st.includes("tolak")) {
      jaDesc = `ご注文番号【${orderId}】の返品申請は確認の結果、規定を満たさないため却下となりました。`;
    } else if (st.includes("resolv") || st.includes("selesai")) {
      jaDesc = `ご注文番号【${orderId}】の返品・交換のお手続きがすべて完了いたしました。`;
    } else {
      jaDesc = `ご注文番号【${orderId}】の返品ステータスが更新されました。`;
    }
    return { title: jaTitle, desc: jaDesc };
  }

  // 7. Resi pengembalian telah ditambahkan: RESI
  const returResiMatch = desc.match(/Nomor\s+resi\s+pengembalian\s+telah\s+ditambahkan:\s*(.*)/i);
  if (returResiMatch) {
    const resi = returResiMatch[1]?.trim();
    jaDesc = `返送用送り状番号が登録されました: ${resi}`;
    return { title: jaTitle, desc: jaDesc };
  }

  // 8. Paket langganan X sedang diproses/dikirim
  const subMatch = desc.match(/Paket\s+(.*?)\s+\(Pengiriman\s+ke-(\d+)\s+dari\s+(\d+)\)\s+sedang\s+diproses/i);
  if (subMatch) {
    const pkg = subMatch[1];
    const current = subMatch[2];
    const total = subMatch[3];
    jaDesc = `定期便【${pkg}】（第${current}回／全${total}回）の発送準備を開始いたしました。`;
    return { title: jaTitle, desc: jaDesc };
  }

  // 9. Low stock alert: X is running low on stock (Y left)
  const stockMatch = desc.match(/(.*?)\s+is\s+running\s+low\s+on\s+stock\s+\((\d+)\s+left\)/i);
  if (stockMatch) {
    const item = stockMatch[1];
    const count = stockMatch[2];
    jaDesc = `商品【${item}】の在庫残数が少なくなっています（残り ${count} 個）。`;
    return { title: jaTitle, desc: jaDesc };
  }

  // 10. Sample request: X requested a sample box
  const sampleMatch = desc.match(/(.*?)\s+requested\s+a\s+sample\s+box/i);
  if (sampleMatch) {
    const shop = sampleMatch[1];
    jaDesc = `【${shop}】様よりB2Bサンプルボックスのご請求がありました。`;
    return { title: jaTitle, desc: jaDesc };
  }

  // 11. New Order: Order ORD-XXXX from Erik is pending
  const ordPendingMatch = desc.match(/Order\s+([A-Za-z0-9-_]+)\s+from\s+(.*?)\s+is\s+pending/i);
  if (ordPendingMatch) {
    const orderId = ordPendingMatch[1];
    const cust = ordPendingMatch[2];
    jaDesc = `【${cust}】様からのご注文番号【${orderId}】の決済手続き待ちです。`;
    return { title: jaTitle, desc: jaDesc };
  }

  // 12. Pesanan baru ORD-XXXX sebesar Rp ...
  const newOrdMatch = desc.match(/Order\s+([A-Za-z0-9-_]+)\s+dari\s+(.*?)\s+\(Rp\s*([0-9.,]+)\)/i);
  if (newOrdMatch) {
    const orderId = newOrdMatch[1];
    const cust = newOrdMatch[2];
    const amount = newOrdMatch[3];
    jaDesc = `【${cust}】様よりご注文【${orderId}】（総額 Rp ${amount}）を承りました。`;
    return { title: jaTitle, desc: jaDesc };
  }

  return { title: jaTitle, desc: jaDesc };
}

function localizeEnglish(title: string, desc: string): LocalizedNotification {
  let enTitle = title;
  let enDesc = desc;

  const trimmedTitle = title.trim();
  if (trimmedTitle.includes("Update Status Pesanan") || trimmedTitle === "Status Pesanan") {
    enTitle = "Order Status Update";
  } else if (trimmedTitle.includes("Pesanan Diproses")) {
    enTitle = "Order Processing";
  } else if (trimmedTitle.includes("Pesanan Dikirim")) {
    enTitle = "Order Shipped";
  } else if (trimmedTitle.includes("Pesanan Tiba")) {
    enTitle = "Order Delivered";
  } else if (trimmedTitle.includes("Pesanan Selesai")) {
    enTitle = "Order Completed";
  } else if (trimmedTitle.includes("Pesanan Dibatalkan")) {
    enTitle = "Order Cancelled";
  } else if (trimmedTitle.includes("Pembayaran Dikonfirmasi") || trimmedTitle.includes("Pembayaran Berhasil")) {
    enTitle = "Payment Confirmed";
  } else if (trimmedTitle.includes("Pesanan Baru")) {
    enTitle = "New Order Received";
  } else if (trimmedTitle.includes("Permintaan Retur Baru")) {
    enTitle = "New Return Request";
  } else if (trimmedTitle.includes("Status Retur Diperbarui") || trimmedTitle.includes("Update Retur")) {
    enTitle = "Return Status Update";
  }

  // Pattern checks for description
  const statusMatch = desc.match(/Pesanan\s+([A-Za-z0-9-_]+)\s+Anda\s+sekarang\s+berstatus:\s*(\w+)/i);
  if (statusMatch) {
    const orderId = statusMatch[1];
    const status = statusMatch[2];
    enDesc = `Your order ${orderId} is now: ${status}.`;
    return { title: enTitle, desc: enDesc };
  }

  const shipMatch = desc.match(/Pesanan\s+([A-Za-z0-9-_]+)\s+telah\s+dikirim(?:\s+dengan\s+resi\s+(.*))?/i);
  if (shipMatch) {
    const orderId = shipMatch[1];
    const resi = shipMatch[2]?.trim() || "-";
    enDesc = `Order ${orderId} has been shipped (Tracking: ${resi}).`;
    return { title: enTitle, desc: enDesc };
  }

  const arriveMatch = desc.match(/Pesanan\s+([A-Za-z0-9-_]+)\s+telah\s+tiba\s+di\s+tujuan/i);
  if (arriveMatch) {
    const orderId = arriveMatch[1];
    enDesc = `Order ${orderId} has arrived at destination. Please confirm receipt!`;
    return { title: enTitle, desc: enDesc };
  }

  return { title: enTitle, desc: enDesc };
}

/**
 * Helper to format date strings according to active language locale (e.g. ja-JP, en-US, id-ID)
 */
export function formatNotificationDate(dateStr: string | number | Date, lang: string = "id"): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);

    if (lang === "ja") {
      return date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    if (lang === "en") {
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (_err) {
    return String(dateStr);
  }
}
