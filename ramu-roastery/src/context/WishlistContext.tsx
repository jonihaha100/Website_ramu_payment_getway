"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { useLang } from "./LanguageContext";

interface WishlistContextType {
  wishlist: string[]; // Array of product IDs
  wishlistCount: number;
  toggleWishlist: (productId: string, productName?: string) => boolean;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  wishlistCount: 0,
  toggleWishlist: () => false,
  isInWishlist: () => false,
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const { user } = useAuth();
  const { addToast } = useToast();
  const { lang } = useLang();
  
  // Storage key based on user email to separate wishlists if needed
  const storageKey = user ? `ramu_wishlist_${user.email}` : null;

  // Load from localStorage on mount or user change
  useEffect(() => {
    if (!storageKey) {
      setWishlist([]);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      setWishlist(stored ? JSON.parse(stored) : []);
    } catch {
      setWishlist([]);
    }
  }, [storageKey]);


  // Save to localStorage when wishlist changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(wishlist));
    }
  }, [wishlist, storageKey]);

  const toggleWishlist = (productId: string, productName?: string): boolean => {
    if (!user) {
      const msg = lang === 'ja'
        ? "🔒 お気に入りに保存するにはログインしてください！"
        : lang === 'en'
        ? "🔒 Please sign in first to save to your Wishlist!"
        : "🔒 Silakan masuk (login) terlebih dahulu untuk menyimpan ke Wishlist!";
      addToast(msg, 'info');
      return false;
    }
    
    const isCurrentlySaved = wishlist.includes(productId);
    
    if (isCurrentlySaved) {
      setWishlist(prev => prev.filter(id => id !== productId));
      const msg = lang === 'ja'
        ? (productName ? `💔 「${productName}」をお気に入りから削除しました` : "💔 お気に入りから削除しました")
        : lang === 'en'
        ? (productName ? `💔 "${productName}" removed from Wishlist` : "💔 Product removed from Wishlist")
        : (productName ? `💔 "${productName}" dihapus dari Wishlist` : "💔 Produk dihapus dari Wishlist");
      addToast(msg, 'info');
      return false;
    } else {
      setWishlist(prev => [...prev, productId]);
      const msg = lang === 'ja'
        ? (productName ? `❤️ 「${productName}」をお気に入りに保存しました！` : "❤️ お気に入りに保存しました！")
        : lang === 'en'
        ? (productName ? `❤️ "${productName}" saved to your Wishlist!` : "❤️ Added to Wishlist!")
        : (productName ? `❤️ "${productName}" berhasil disimpan ke Wishlist!` : "❤️ Ditambahkan ke Wishlist!");
      addToast(msg, 'success');
      return true;
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistCount: wishlist.length, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}

