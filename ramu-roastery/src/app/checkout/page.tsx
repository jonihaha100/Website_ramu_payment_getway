"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { CustomerDetails, CheckoutPayload } from "../../types/cart";
import styles from "./Checkout.module.css";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState<CustomerDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const shippingCost = 20000; // Flat rate for now
  const grandTotal = cartTotal + shippingCost;

  useEffect(() => {
    // If cart is empty, redirect back to catalog
    if (items.length === 0 && !loading) {
      router.push("/catalog");
    }
  }, [items, router, loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: CheckoutPayload = {
        items,
        customer,
        shippingCost,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // DUMMY FLOW: Simulate a successful payment popup
      alert(`[DUMMY MODE]\n\nTerima kasih ${customer.firstName}!\n\nPesanan Anda dengan Order ID: ${data.orderId} sedang diproses.\nIni adalah simulasi pembayaran berhasil.`);
      
      clearCart();
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null; // Avoid flicker before redirect

  return (
    <main className={styles.checkoutPage}>
      <div className="container">
        <h1 className={styles.title}>Checkout (Dummy Mode)</h1>
        
        <div className={styles.grid}>
          <div className={styles.formSection}>
            <h2>Shipping Details</h2>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleCheckout} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>First Name</label>
                  <input type="text" name="firstName" value={customer.firstName} onChange={handleInputChange} required />
                </div>
                <div className={styles.field}>
                  <label>Last Name</label>
                  <input type="text" name="lastName" value={customer.lastName} onChange={handleInputChange} required />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Email</label>
                  <input type="email" name="email" value={customer.email} onChange={handleInputChange} required />
                </div>
                <div className={styles.field}>
                  <label>Phone</label>
                  <input type="tel" name="phone" value={customer.phone} onChange={handleInputChange} required />
                </div>
              </div>
              <div className={styles.field}>
                <label>Address</label>
                <textarea name="address" value={customer.address} onChange={handleInputChange} required rows={3}></textarea>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>City</label>
                  <input type="text" name="city" value={customer.city} onChange={handleInputChange} required />
                </div>
                <div className={styles.field}>
                  <label>Postal Code</label>
                  <input type="text" name="postalCode" value={customer.postalCode} onChange={handleInputChange} required />
                </div>
              </div>
              
              <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
                {loading ? "Processing..." : "Pay Now (Dummy)"}
              </button>
            </form>
          </div>

          <div className={styles.summarySection}>
            <h2>Order Summary</h2>
            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.weight >= 1000 ? item.weight/1000 + 'kg' : item.weight + 'g'} - {item.grind} (x{item.quantity})</p>
                  </div>
                  <span>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
            <div className={styles.summaryTotals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>Rp {cartTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span>Rp {shippingCost.toLocaleString("id-ID")}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
