"use client";

import { useCart } from "../../context/CartContext";
import { useLang } from "../../context/LanguageContext";
import styles from "./CartSidebar.module.css";

export default function CartSidebar() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQty, totalPrice, clearCart } = useCart();
  const { lang } = useLang();

  const label = {
    id: {
      title: "Keranjang Belanja",
      empty: "Keranjang Anda masih kosong.",
      remove: "Hapus",
      clear: "Kosongkan",
      checkout_wa: "Pesan via WhatsApp",
      checkout_direct: "Bayar Langsung",
      total: "Total",
      size: "Ukuran",
      grind: "Gilingan",
    },
    en: {
      title: "Shopping Cart",
      empty: "Your cart is empty.",
      remove: "Remove",
      clear: "Clear Cart",
      checkout_wa: "Order via WhatsApp",
      checkout_direct: "Direct Payment",
      total: "Total",
      size: "Size",
      grind: "Grind",
    },
  }[lang];

  const waNumber = "6280000000000"; // Placeholder – ganti dengan nomor WA RRC asli
  const waMessage = items
    .map(
      (item) =>
        `- ${item.name} (${item.weight >= 1000 ? item.weight / 1000 + "kg" : item.weight + "g"}, ${item.grind}) x${item.quantity} = Rp ${(item.price * item.quantity).toLocaleString("id-ID")}`
    )
    .join("%0A");
  const waFull = `https://wa.me/${waNumber}?text=${lang === "id" ? "Halo" : "Hello"} Ramu Roastery!%0A%0A${waMessage}%0A%0ATotal: Rp ${totalPrice.toLocaleString("id-ID")}%0A%0A${lang === "id" ? "Mohon konfirmasi ketersediaan dan ongkir. Terima kasih!" : "Please confirm availability and shipping cost. Thank you!"}`;

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div className={styles.backdrop} onClick={() => setIsCartOpen(false)} />
      )}

      {/* Sidebar Drawer */}
      <aside className={`${styles.sidebar} ${isCartOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <h2>{label.title}</h2>
          <button className={styles.closeBtn} onClick={() => setIsCartOpen(false)} aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className={styles.itemList}>
          {items.length === 0 ? (
            <p className={styles.emptyMsg}>{label.empty}</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemMeta}>
                    {label.size}: {item.weight >= 1000 ? item.weight / 1000 + " kg" : item.weight + " g"} &bull; {label.grind}: {item.grind}
                  </p>
                  <p className={styles.itemPrice}>
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className={styles.itemControls}>
                  <div className={styles.qtyControl}>
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                    {label.remove}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>{label.total}</span>
              <span className={styles.totalPrice}>Rp {totalPrice.toLocaleString("id-ID")}</span>
            </div>
            <a href={waFull} target="_blank" rel="noopener noreferrer" className={`btn-primary ${styles.actionBtn}`}>
              {label.checkout_wa}
            </a>
            <button
              className={`btn-outline ${styles.actionBtn}`}
              onClick={() => alert(lang === "id" ? "Integrasi pembayaran langsung segera hadir!" : "Direct Payment Integration coming soon!")}
            >
              {label.checkout_direct}
            </button>
            <button className={styles.clearBtn} onClick={clearCart}>
              {label.clear}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
