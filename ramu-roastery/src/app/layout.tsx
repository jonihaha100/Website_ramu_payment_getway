import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import Navbar from "../components/Navbar/Navbar";

import { CartProvider } from "../context/CartContext";
import CartSidebar from "../components/CartSidebar/CartSidebar";

export const metadata: Metadata = {
  title: "Ramu Roastery Company",
  description: "Crafted with Quality, Grounded in Commitment. Exceptional Indonesian Coffee for the World.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <CartProvider>
          <LanguageProvider>
            <Navbar />
            <CartSidebar />
            {children}
          </LanguageProvider>
        </CartProvider>
      </body>
    </html>
  );
}
