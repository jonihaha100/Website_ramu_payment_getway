"use client";

import { useState } from "react";
import Link from "next/link";
import { coffees } from "../../data/coffees";
import { useLang } from "../../context/LanguageContext";
import { t } from "../../data/translations";
import styles from "./Catalog.module.css";

export default function Catalog() {
  const { lang } = useLang();
  const tr = t[lang];

  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterProcess, setFilterProcess] = useState<string>("All");

  const filteredCoffees = coffees.filter((coffee) => {
    const categoryMatch = filterCategory === "All" || coffee.category === filterCategory;
    const processMatch = filterProcess === "All" || coffee.process === filterProcess;
    return categoryMatch && processMatch;
  });

  return (
    <main className={styles.catalogPage}>
      <div className="container">
        <header className={styles.header}>
          <h1>{tr.catalog_title}</h1>
          <p>{tr.catalog_sub}</p>
        </header>

        <div className={styles.layout}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterGroup}>
              <h3>{tr.filter_category}</h3>
              {[{ val: "All", label: tr.filter_all_cat }, { val: "Espresso", label: "Espresso" }, { val: "Filter", label: "Filter" }].map((f) => (
                <button
                  key={f.val}
                  className={filterCategory === f.val ? styles.activeFilter : styles.filterBtn}
                  onClick={() => setFilterCategory(f.val)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className={styles.filterGroup}>
              <h3>{tr.filter_process}</h3>
              {[
                { val: "All", label: tr.filter_all_proc },
                { val: "Wash", label: "Washed" },
                { val: "Natural", label: "Natural" },
                { val: "Honey", label: "Honey" },
                { val: "Anaerobic", label: "Anaerobic" },
              ].map((f) => (
                <button
                  key={f.val}
                  className={filterProcess === f.val ? styles.activeFilter : styles.filterBtn}
                  onClick={() => setFilterProcess(f.val)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Product Grid */}
          <div className={styles.productGrid}>
            {filteredCoffees.length > 0 ? (
              filteredCoffees.map((coffee) => (
                <Link href={`/product/${coffee.id}`} key={coffee.id} className={`${styles.productCard} glass`}>
                  <div className={styles.imagePlaceholder}>
                    <span className={styles.categoryBadge}>{coffee.category}</span>
                  </div>
                  <div className={styles.cardContent}>
                    <h2>{coffee.name}</h2>
                    <p className={styles.origin}>{coffee.origin} • {coffee.process}</p>
                    <div className={styles.tastingNotes}>
                      {coffee.tastingNotes.map((note) => (
                        <span key={note} className={styles.noteTag}>{note}</span>
                      ))}
                    </div>
                    <p className={styles.price}>
                      Rp {coffee.pricePerKg.toLocaleString("id-ID")} / kg
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className={styles.noResults}>
                <p>{tr.no_results}</p>
                <button
                  onClick={() => { setFilterCategory("All"); setFilterProcess("All"); }}
                  className="btn-outline"
                >
                  {tr.clear_filter}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
