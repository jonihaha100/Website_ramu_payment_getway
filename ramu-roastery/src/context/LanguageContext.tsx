"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "id" | "en" | "ja";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "id",
  setLang: () => {},
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("id");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("ramu_preferred_language") as Language | null;
      if (savedLang && (savedLang === "id" || savedLang === "en" || savedLang === "ja")) {
        setLangState(savedLang);
      }
    } catch (e) {}
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("ramu_preferred_language", newLang);
    } catch (e) {}
  };

  const toggleLang = () => {
    setLangState((prev) => {
      const next: Language = prev === "id" ? "en" : prev === "en" ? "ja" : "id";
      try {
        localStorage.setItem("ramu_preferred_language", next);
      } catch (e) {}
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

