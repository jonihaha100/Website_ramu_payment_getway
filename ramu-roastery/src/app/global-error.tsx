"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="id">
      <head>
        <title>Terjadi Kesalahan - Ramu Roastery</title>
      </head>
      <body style={{ margin: 0, backgroundColor: "#0f0d0b", color: "#f7f2eb", fontFamily: "sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              padding: "40px",
              borderRadius: "16px",
              background: "rgba(35, 29, 24, 0.75)",
              border: "1px solid rgba(200, 138, 66, 0.25)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>☕</div>
            <h1 style={{ fontSize: "1.75rem", margin: "0 0 12px", color: "#e5a962" }}>
              Terjadi Kendala Sistem
            </h1>
            <p style={{ color: "#a89f91", lineHeight: 1.6, fontSize: "0.95rem", margin: "0 0 24px" }}>
              Mohon maaf atas ketidaknyamanannya. Laporan error telah otomatis diteruskan ke tim pengembang kami untuk segera ditangani.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: "10px 22px",
                  borderRadius: "8px",
                  border: "1px solid #c88a42",
                  background: "transparent",
                  color: "#e5a962",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                Coba Lagi
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  padding: "10px 22px",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, #c88a42, #8b5a2b)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
