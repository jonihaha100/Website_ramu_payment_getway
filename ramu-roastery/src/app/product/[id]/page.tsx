"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { coffees } from "../../../data/coffees";
import { useCart } from "../../../context/CartContext";
import styles from "./ProductDetail.module.css";

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const coffee = coffees.find(c => c.id === id);
  const { addToCart } = useCart();

  const [weight, setWeight] = useState<number>(200);
  const [grind, setGrind] = useState<string>("Whole Beans");

  if (!coffee) {
    return (
      <div className="container section text-center">
        <h1>Product Not Found</h1>
        <Link href="/catalog" className="btn-primary" style={{marginTop: '2rem'}}>Back to Catalog</Link>
      </div>
    );
  }

  // Calculate price based on weight (pricePerKg / 1000 * weight)
  const totalPrice = (coffee.pricePerKg / 1000) * weight;

  const handleAddToCart = () => {
    addToCart({
      id: `${coffee.id}-${grind}-${weight}`,
      productId: coffee.id,
      name: coffee.name,
      price: totalPrice,
      quantity: 1,
      weight,
      grind,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  // WhatsApp Generator (Optional, keep for alternative)
  const waNumber = "6280000000000"; // Placeholder
  const waMessage = `Halo Ramu Roastery! Saya ingin memesan kopi:%0A%0A*${coffee.name}*%0AUkuran: ${weight >= 1000 ? weight/1000 + 'kg' : weight + 'g'}%0AProfil Gilingan: ${grind}%0ATotal Harga: Rp ${totalPrice.toLocaleString('id-ID')}%0A%0AMohon info ketersediaan dan ongkos kirim. Terima kasih!`;
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <main className={styles.productPage}>
      <div className="container">
        <Link href="/catalog" className={styles.backLink}>← Back to Catalog</Link>
        
        <div className={styles.grid}>
          {/* Image Placeholder */}
          <div className={styles.imageGallery}>
            <div className={`${styles.mainImage} glass`}>
              <span>{coffee.name} Image</span>
            </div>
          </div>

          {/* Product Info */}
          <div className={styles.details}>
            <div className={styles.header}>
              <span className={styles.categoryBadge}>{coffee.category}</span>
              <h1 className={styles.title}>{coffee.name}</h1>
              <p className={styles.origin}>{coffee.origin} • {coffee.process}</p>
            </div>

            <p className={styles.price}>Rp {totalPrice.toLocaleString('id-ID')}</p>

            <p className={styles.description}>{coffee.description}</p>

            <div className={styles.tastingNotes}>
              <h4>Tasting Notes</h4>
              <div className={styles.tags}>
                {coffee.tastingNotes.map(note => (
                  <span key={note} className={styles.noteTag}>{note}</span>
                ))}
              </div>
            </div>

            {/* Customization Options */}
            <div className={styles.optionsSection}>
              <h4>Size</h4>
              <div className={styles.optionGrid}>
                {[200, 500, 1000, 5000].map(w => (
                  <button 
                    key={w}
                    className={weight === w ? styles.optionBtnActive : styles.optionBtn}
                    onClick={() => setWeight(w)}
                  >
                    {w >= 1000 ? w/1000 + ' kg' : w + ' g'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.optionsSection}>
              <h4>Grind Profile</h4>
              <div className={styles.optionGrid}>
                {["Whole Beans", "Coarse (Kasar)", "Medium (Sedang)", "Fine (Halus)"].map(g => (
                  <button 
                    key={g}
                    className={grind === g ? styles.optionBtnActive : styles.optionBtn}
                    onClick={() => setGrind(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkout Actions */}
            <div className={styles.checkoutActions} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                <button className="btn-outline" style={{ flex: 1 }} onClick={handleAddToCart}>
                  Add to Cart
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleBuyNow}>
                  Buy Now
                </button>
              </div>
              
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}>
                Atau pesan via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
