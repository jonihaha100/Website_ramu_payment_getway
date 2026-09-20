"use client";

import { useState, useEffect } from "react";
import { Coffee } from "../../data/coffees";

const emptyProduct: Coffee = {
  id: "",
  name: "",
  category: "Espresso",
  process: "Wash",
  origin: "",
  tastingNotes: [],
  description: "",
  pricePerKg: 0,
  stock: 0,
  imageUrl: "",
};

export default function ProductTable() {
  const [products, setProducts] = useState<Coffee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Coffee>(emptyProduct);
  const [isNew, setIsNew] = useState(true);

  // Stock Management Modal State
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Coffee | null>(null);
  const [stockForm, setStockForm] = useState({ amount: 0, unit: 'KG' as 'KG' | 'GRAM', type: 'STOCK_IN', notes: '' });

  // Smart Pricing Advisor State
  const [greenBeanHpp, setGreenBeanHpp] = useState<number>(110000);
  const [roastingOpCost, setRoastingOpCost] = useState<number>(15000);
  const [shrinkageRate] = useState<number>(0.18); // 18% roasting shrinkage
  const [targetSize, setTargetSize] = useState<number>(250);
  const [showAdvisor, setShowAdvisor] = useState<boolean>(true);

  // Fetch products on load
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
      })
      .catch(_err => {
        console.error("Failed to fetch products:", _err);
      });
  }, []);

  // Open modal for editing
  const handleEdit = (product: Coffee) => {
    const categorySizes = product.category === 'Filter' ? [150, 250] : [250, 500, 1000];
    const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : categorySizes;
    const prices: Record<number, number> = { ...(product.prices || {}) };
    sizes.forEach(sz => {
      if (!prices[sz]) {
        prices[sz] = Math.round((product.pricePerKg / 1000) * sz);
      }
    });
    setEditingProduct({
      ...product,
      sizes,
      prices
    });
    setTargetSize(sizes[0]);
    setIsNew(false);
    setIsModalOpen(true);
  };

  // Open modal for creating new
  const handleAddNew = () => {
    const defaultSizes = [250, 500, 1000];
    setEditingProduct({
      ...emptyProduct,
      id: `prod-${Math.floor(Math.random() * 10000)}`,
      category: "Espresso",
      sizes: defaultSizes,
      prices: { 250: 95000, 500: 175000, 1000: 320000 },
      b2bPricePerKg: 240000
    });
    setTargetSize(250);
    setIsNew(true);
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
        setProducts(products.filter(p => p.id !== id));
      } catch (_err) {
        alert("Failed to delete product");
      }
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!editingProduct.name || !editingProduct.id) {
      alert("Please fill in the required fields (Name).");
      return;
    }

    try {
      if (isNew) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingProduct)
        });
        setProducts([...products, editingProduct]);
      } else {
        await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingProduct)
        });
        setProducts(products.map(p => 
          p.id === editingProduct.id ? editingProduct : p
        ));
      }
      setIsModalOpen(false);
      alert(`Product ${editingProduct.name} saved successfully!`);
    } catch (_err) {
      alert("Failed to save product");
    }
  };

  const handleOpenStock = (product: Coffee) => {
    setStockProduct(product);
    setStockForm({ amount: 0, unit: 'KG', type: 'STOCK_IN', notes: '' });
    setStockModalOpen(true);
  };

  const handleSaveStock = async () => {
    if (!stockProduct || stockForm.amount === 0) return;
    
    const multiplier = stockForm.unit === 'KG' ? 1000 : 1;
    const finalGrams = Math.abs(stockForm.amount) * multiplier;
    const changeAmount = stockForm.type === 'STOCK_IN' ? finalGrams : -finalGrams;
    
    try {
      const res = await fetch('/api/inventory-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: stockProduct.id,
          changeAmount,
          type: stockForm.type,
          notes: stockForm.notes ? `${stockForm.notes} (${stockForm.amount} ${stockForm.unit})` : `${stockForm.amount} ${stockForm.unit}`
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Update local state
      setProducts(products.map(p => p.id === stockProduct.id ? { ...p, stock: data.newStock } : p));
      setStockModalOpen(false);
      alert(`Stok berhasil diperbarui! Stok saat ini: ${data.newStock >= 1000 ? (data.newStock / 1000).toFixed(2) + ' kg' : data.newStock + ' g'}`);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleInputChange = (field: keyof Coffee, value: string | number | string[]) => {
    if (field === 'tastingNotes' && typeof value === 'string') {
      // Split by comma for tasting notes
      const notesArray = value.split(',').map((note: string) => note.trim());
      setEditingProduct({ ...editingProduct, [field]: notesArray });
    } else {
      setEditingProduct({ ...editingProduct, [field]: value });
    }
  };

  const handleCategoryChange = (newCat: "Espresso" | "Filter") => {
    const newSizes = newCat === "Filter" ? [150, 250] : [250, 500, 1000];
    const prices: Record<number, number> = {};
    if (newCat === "Filter") {
      prices[150] = editingProduct.prices?.[150] || Math.round((editingProduct.pricePerKg / 1000) * 150) || 94000;
      prices[250] = editingProduct.prices?.[250] || Math.round((editingProduct.pricePerKg / 1000) * 250) || 132000;
    } else {
      prices[250] = editingProduct.prices?.[250] || 95000;
      prices[500] = editingProduct.prices?.[500] || 175000;
      prices[1000] = editingProduct.prices?.[1000] || editingProduct.pricePerKg || 320000;
    }
    setEditingProduct(prev => ({
      ...prev,
      category: newCat,
      sizes: newSizes,
      prices,
      pricePerKg: newCat === "Filter" ? Math.round((prices[250] || 132000) * 4) : (prices[1000] || 320000)
    }));
    setTargetSize(newSizes[0]);
  };

  const handlePriceChange = (size: number, price: number) => {
    const updatedPrices = { ...(editingProduct.prices || {}), [size]: price };
    let updatedPricePerKg = editingProduct.pricePerKg;
    if (size === 1000) {
      updatedPricePerKg = price;
    } else if (size === 250 && !updatedPrices[1000]) {
      updatedPricePerKg = Math.round(price * 4);
    }
    setEditingProduct(prev => ({
      ...prev,
      pricePerKg: updatedPricePerKg,
      prices: updatedPrices
    }));
  };

  // Smart Pricing Calculations for targetSize
  const packagingCosts: Record<number, number> = {
    150: 4500,
    250: 5000,
    500: 7500,
    1000: 11000
  };
  const currentPackCost = packagingCosts[targetSize] || 5000;
  const roastedGreenCostPerKg = Math.round(greenBeanHpp / (1 - shrinkageRate));
  const totalRoastedCostPerKg = roastedGreenCostPerKg + roastingOpCost;
  const roastedCostPerGram = totalRoastedCostPerKg / 1000;
  const coffeeContentHpp = Math.round(roastedCostPerGram * targetSize);
  const totalPackHpp = coffeeContentHpp + currentPackCost;

  // Pricing Tiers
  const priceTierCukup = Math.round((totalPackHpp / 0.70) / 1000) * 1000;
  const priceTierRekomendasi = Math.round((totalPackHpp / 0.55) / 1000) * 1000;
  const priceTierProfit = Math.round((totalPackHpp / 0.40) / 1000) * 1000;

  // Live margin calculation for targetSize
  const activeSelectedPrice = editingProduct.prices?.[targetSize] || (targetSize === 1000 ? editingProduct.pricePerKg : 0);
  const liveMargin = activeSelectedPrice > 0 
    ? Math.round(((activeSelectedPrice - totalPackHpp) / activeSelectedPrice) * 100)
    : 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({ ...editingProduct, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Product Management</h2>
        <button 
          onClick={handleAddNew}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#111827',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          + Add New Product
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Image</th>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Kemasan & Harga</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.id}>
                <td>{index + 1}</td>
                <td>
                  {product.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={product.imageUrl} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#e5e7eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#9ca3af' }}>No Img</div>
                  )}
                </td>
                <td><span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{product.id}</span></td>
                <td><strong>{product.name}</strong></td>
                <td>
                  <span style={{ 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    background: product.category === 'Filter' ? '#fef3c7' : '#e0e7ff', 
                    color: product.category === 'Filter' ? '#92400e' : '#3730a3' 
                  }}>
                    {product.category}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {product.prices && Object.keys(product.prices).length > 0 ? (
                      Object.entries(product.prices).map(([sz, pr]) => (
                        <span key={sz}>
                          <strong>{Number(sz) >= 1000 ? `${Number(sz)/1000}kg` : `${sz}g`}:</strong> Rp {Number(pr).toLocaleString('id-ID')}
                        </span>
                      ))
                    ) : (
                      <span>Rp {product.pricePerKg.toLocaleString('id-ID')} / kg</span>
                    )}
                    {product.b2bPricePerKg ? (
                      <span style={{ color: '#059669', fontSize: '0.72rem', fontWeight: 600 }}>
                        ☕ B2B: Rp {product.b2bPricePerKg.toLocaleString('id-ID')}/kg
                      </span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ 
                      color: product.stock < 1000 ? '#ef4444' : '#10b981',
                      fontWeight: '700',
                      fontSize: '0.9rem'
                    }}>
                      {product.stock >= 1000 ? `${(product.stock / 1000).toFixed(2)} kg` : `${product.stock} g`}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                      {product.stock > 0 ? `~${Math.floor(product.stock / (product.sizes?.[0] || 250))} bks @${product.sizes?.[0] || 250}g` : 'Habis'}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="admin-action-btn"
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </button>
                    <button 
                      className="admin-action-btn"
                      style={{ color: '#3b82f6' }}
                      onClick={() => handleOpenStock(product)}
                    >
                      📦 Stock
                    </button>
                    <button 
                      className="admin-action-btn"
                      style={{ color: '#ef4444' }}
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Full CRUD Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '680px',
            maxWidth: '92%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '1.25rem' }}>
              {isNew ? 'Add New Product' : 'Edit Product'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Product ID</label>
                <input 
                  type="text" 
                  value={editingProduct.id}
                  disabled
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', backgroundColor: '#f3f4f6' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Name</label>
                <input 
                  type="text" 
                  value={editingProduct.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Category</label>
                <select 
                  value={editingProduct.category}
                  onChange={(e) => handleCategoryChange(e.target.value as "Espresso" | "Filter")}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                >
                  <option value="Espresso">Espresso (Kemasan 250g, 500g, 1kg)</option>
                  <option value="Filter">Filter (Kemasan 150g, 250g)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Process</label>
                <select 
                  value={editingProduct.process}
                  onChange={(e) => handleInputChange('process', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                >
                  <option value="Wash">Wash</option>
                  <option value="Natural">Natural</option>
                  <option value="Honey">Honey</option>
                  <option value="Anaerobic">Anaerobic</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Origin</label>
                <input 
                  type="text" 
                  value={editingProduct.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Tasting Notes (comma separated)</label>
                <input 
                  type="text" 
                  value={editingProduct.tastingNotes.join(', ')}
                  onChange={(e) => handleInputChange('tastingNotes', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Product Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {editingProduct.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={editingProduct.imageUrl} 
                      alt="Preview" 
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb' }} 
                    />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ width: '100%', padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  Stok Sangrai Fisik (gram) — <strong>{editingProduct.stock >= 1000 ? `${(editingProduct.stock / 1000).toFixed(2)} kg` : `${editingProduct.stock} g`}</strong>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    value={editingProduct.stock}
                    onChange={(e) => handleInputChange('stock', Number(e.target.value))}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                    placeholder="Contoh: 50000 untuk 50 kg"
                  />
                  <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>gram</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  1 kg = 1.000 gram (Contoh: ketik 50000 jika memiliki stok sangrai 50 kg)
                </span>
              </div>
            </div>

            {/* Independent Package Pricing Section */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🏷️</span> Independent Package Pricing (Harga Kemasan Mandiri)
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Zero Linear Division</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                Setiap ukuran memiliki harga tersendiri yang memperhitungkan biaya packaging valve pouch dan target laba.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {(editingProduct.sizes || (editingProduct.category === 'Filter' ? [150, 250] : [250, 500, 1000])).map(sz => (
                  <div key={sz}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Kemasan {sz >= 1000 ? `${sz/1000}kg` : `${sz}g`} (Rp)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.prices?.[sz] || ''}
                      onChange={(e) => handlePriceChange(sz, Number(e.target.value))}
                      placeholder={`Rp untuk ${sz}g`}
                      style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.85rem' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#047857', marginBottom: '0.25rem' }}>
                    ☕ Grosir B2B / kg (Min 5kg)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.b2bPricePerKg || ''}
                    onChange={(e) => handleInputChange('b2bPricePerKg', Number(e.target.value))}
                    placeholder="Rp / kg B2B"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid #a7f3d0', borderRadius: '0.25rem', fontSize: '0.85rem', backgroundColor: '#f0fdf4' }}
                  />
                </div>
              </div>
            </div>

            {/* Smart Pricing Advisor Widget */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
              border: '1px solid #cbd5e1', 
              borderRadius: '0.5rem', 
              padding: '1rem', 
              marginBottom: '1rem' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>💡</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#0f172a', fontWeight: 700 }}>
                      Smart Pricing Advisor & Kalkulator HPP
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Perhitungan HPP riil: Susut Sangrai 18% + Gas & Roaster + Pouch Valve
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvisor(!showAdvisor)}
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                >
                  {showAdvisor ? 'Tutup' : 'Buka'}
                </button>
              </div>

              {showAdvisor && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', marginBottom: '0.2rem' }}>Green Bean HPP (Rp/kg)</label>
                      <input
                        type="number"
                        value={greenBeanHpp}
                        onChange={(e) => setGreenBeanHpp(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.35rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.8rem', background: '#ffffff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', marginBottom: '0.2rem' }}>Biaya Sangrai & Gas (Rp/kg)</label>
                      <input
                        type="number"
                        value={roastingOpCost}
                        onChange={(e) => setRoastingOpCost(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.35rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.8rem', background: '#ffffff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', marginBottom: '0.2rem' }}>Target Kemasan</label>
                      <select
                        value={targetSize}
                        onChange={(e) => setTargetSize(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.35rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.8rem', background: '#ffffff' }}
                      >
                        {(editingProduct.sizes || (editingProduct.category === 'Filter' ? [150, 250] : [250, 500, 1000])).map(sz => (
                          <option key={sz} value={sz}>{sz >= 1000 ? `${sz/1000} kg` : `${sz} gram`}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '0.6rem 0.85rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>HPP Riil Kemasan ({targetSize}g): </span>
                      <strong style={{ color: '#0f172a' }}>Rp {totalPackHpp.toLocaleString('id-ID')}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.7rem', marginLeft: '0.5rem' }}>
                        (Kopi: Rp {coffeeContentHpp.toLocaleString('id-ID')} + Pouch: Rp {currentPackCost.toLocaleString('id-ID')})
                      </span>
                    </div>
                    <div>
                      {activeSelectedPrice > 0 ? (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: liveMargin < 25 ? '#fee2e2' : liveMargin < 42 ? '#dcfce7' : '#f3e8ff',
                          color: liveMargin < 25 ? '#991b1b' : liveMargin < 42 ? '#166534' : '#6b21a8'
                        }}>
                          {liveMargin < 25 ? `⚠️ Margin Rendah (${liveMargin}%)` : liveMargin < 42 ? `✅ Margin Sehat (${liveMargin}%)` : `🔥 Margin Optimal (${liveMargin}%)`}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Harga belum diisi</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                      Klik tombol tier di bawah untuk langsung mengisi harga kemasan {targetSize}g:
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handlePriceChange(targetSize, priceTierCukup)}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.375rem',
                          background: '#ffffff',
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Cukup (30%)</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Rp {priceTierCukup.toLocaleString('id-ID')}</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePriceChange(targetSize, priceTierRekomendasi)}
                        style={{
                          padding: '0.5rem',
                          border: '2px solid #10b981',
                          borderRadius: '0.375rem',
                          background: '#ecfdf5',
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700 }}>⭐ Rekomendasi (45%)</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#065f46' }}>Rp {priceTierRekomendasi.toLocaleString('id-ID')}</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePriceChange(targetSize, priceTierProfit)}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid #d8b4fe',
                          borderRadius: '0.375rem',
                          background: '#faf5ff',
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', color: '#7e22ce' }}>🔥 Profit Banget (60%)</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#581c87' }}>Rp {priceTierProfit.toLocaleString('id-ID')}</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Description</label>
              <textarea 
                value={editingProduct.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#111827',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                {isNew ? 'Create Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {stockModalOpen && stockProduct && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.25rem' }}>Update Stock</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#4b5563', fontSize: '0.875rem' }}>
              Product: <strong>{stockProduct.name}</strong> (Current: {stockProduct.stock >= 1000 ? `${(stockProduct.stock / 1000).toFixed(2)} kg` : `${stockProduct.stock} g`})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Transaction Type</label>
                <select 
                  value={stockForm.type}
                  onChange={(e) => setStockForm({...stockForm, type: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                >
                  <option value="STOCK_IN">STOCK IN (Tambah Stok)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT / OUT (Kurangi Stok)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Jumlah Perubahan Stok</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="number"
                    min="0.1"
                    step="any"
                    placeholder="Contoh: 10 untuk 10 kg"
                    value={stockForm.amount || ''}
                    onChange={(e) => setStockForm({...stockForm, amount: Number(e.target.value)})}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                  />
                  <select
                    value={stockForm.unit}
                    onChange={(e) => setStockForm({...stockForm, unit: e.target.value as 'KG' | 'GRAM'})}
                    style={{ width: '120px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', background: '#f8fafc', fontWeight: 600 }}
                  >
                    <option value="KG">Kilogram (kg)</option>
                    <option value="GRAM">Gram (g)</option>
                  </select>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                  = {((stockForm.amount || 0) * (stockForm.unit === 'KG' ? 1000 : 1)).toLocaleString('id-ID')} gram
                </span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Notes / Reference</label>
                <input 
                  type="text"
                  placeholder="e.g. Roasting batch #401"
                  value={stockForm.notes}
                  onChange={(e) => setStockForm({...stockForm, notes: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setStockModalOpen(false)}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveStock}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                Save Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
