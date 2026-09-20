"use client";

import { useCart } from "../../context/CartContext";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./CartSidebar.module.css";

export default function CartSidebar() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQty, totalPrice, clearCart } = useCart();
  const { lang } = useLang();
  const { user } = useAuth();
  const router = useRouter();

  const label = {
    id: {
      title: "Keranjang Belanja",
      empty: "Keranjang Anda masih kosong.",
      remove: "Hapus",
      clear: "Kosongkan",
      checkout_direct: "Bayar Langsung",
      total: "Total",
      size: "Ukuran",
      grind: "Gilingan",
      shop_now: "Belanja Kopi Sekarang",
    },
    en: {
      title: "Shopping Cart",
      empty: "Your cart is empty.",
      remove: "Remove",
      clear: "Clear Cart",
      checkout_direct: "Checkout",
      total: "Total",
      size: "Size",
      grind: "Grind",
      shop_now: "Shop Coffee Now",
    },
    ja: {
      title: "ショッピングカート",
      empty: "カートは現在空です。",
      remove: "削除",
      clear: "カートを空にする",
      checkout_direct: "レジへ進む",
      total: "合計",
      size: "サイズ",
      grind: "挽き目",
      shop_now: "コーヒー豆を探す",
    },
  }[lang] || {
    title: "ショッピングカート",
    empty: "カートは現在空です。",
    remove: "削除",
    clear: "カートを空にする",
    checkout_direct: "レジへ進む",
    total: "合計",
    size: "サイズ",
    grind: "挽き目",
    shop_now: "コーヒー豆を探す",
  };


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
            <div className={styles.emptyStateContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', color: '#d1d5db' }}>🛒</div>
              <p className={styles.emptyMsg} style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '1rem' }}>{label.empty}</p>
              <button 
                className="btn-primary" 
                style={{ width: '100%' }}
                onClick={() => {
                  setIsCartOpen(false);
                  router.push('/catalog');
                }}
              >
                {label.shop_now}
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemMeta}>
                    {label.size}: {item.weight >= 1000 ? item.weight / 1000 + " kg" : item.weight + " g"} &bull; {label.grind}: {
                      lang === 'ja'
                        ? (item.grind === 'Whole Beans' || item.grind === 'Biji Utuh' ? '豆のまま'
                          : item.grind === 'Coarse' || item.grind === 'Kasar' ? '粗挽き'
                          : item.grind === 'Medium' || item.grind === 'Sedang' ? '中挽き'
                          : item.grind === 'Fine' || item.grind === 'Halus' ? '細挽き'
                          : item.grind)
                        : lang === 'en'
                        ? (item.grind === 'Biji Utuh' ? 'Whole Beans'
                          : item.grind === 'Kasar' ? 'Coarse'
                          : item.grind === 'Sedang' ? 'Medium'
                          : item.grind === 'Halus' ? 'Fine'
                          : item.grind)
                        : (item.grind === 'Whole Beans' ? 'Biji Utuh'
                          : item.grind === 'Coarse' ? 'Kasar'
                          : item.grind === 'Medium' ? 'Sedang'
                          : item.grind === 'Fine' ? 'Halus'
                          : item.grind)
                    }
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
            
            <button
              className={`btn-primary ${styles.actionBtn}`}
              onClick={() => {
                if (!user) {
                  router.push('/login?callbackUrl=/checkout');
                } else {
                  router.push('/checkout');
                }
                setIsCartOpen(false);
              }}
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
