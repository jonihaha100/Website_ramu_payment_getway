import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import Navbar from "../components/Navbar/Navbar";

import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { WishlistProvider } from "../context/WishlistContext";
import { ToastProvider } from "../context/ToastContext";
import CartSidebar from "../components/CartSidebar/CartSidebar";
import WhatsAppChat from "../components/LiveChat/WhatsAppChat";
import TopTicker from "../components/TopTicker/TopTicker";
import PromoModal from "../components/PromoModal/PromoModal";
import OnboardingGuide from "../components/OnboardingGuide/OnboardingGuide";
import TourGuide from "../components/Onboarding/TourGuide";
import BottomNav from "../components/BottomNav/BottomNav";

export const metadata: Metadata = {
  title: "Ramu Roastery Company",
  description: "Crafted with Quality, Grounded in Commitment. Exceptional Indonesian Coffee for the World.",
  other: {
    "strix-verification": "strix-verify-d1f781c10ef98d2d65dd51ff6e14a4a6",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider>
              <CartProvider>
                <WishlistProvider>
                  <TopTicker />
                  <Navbar />
                  <CartSidebar />
                  {children}
                  <BottomNav />
                  <WhatsAppChat />
                  <PromoModal />
                  <OnboardingGuide />
                  <TourGuide />
                </WishlistProvider>
              </CartProvider>
            </ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

