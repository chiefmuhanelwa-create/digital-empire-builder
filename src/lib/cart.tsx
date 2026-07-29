import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Digital products are one-of-a-kind downloads — nobody buys 2 copies of a
// PDF — so the cart is just a set of product slugs, not slug+quantity pairs.
// Persisted to localStorage so it survives a reload/return-visit, same as the
// real Shopify cart cookie.
const CART_KEY = "chkplt_cart";

function readCart(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function writeCart(slugs: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(slugs));
  // Same-tab listeners (the header badge) don't get a native "storage" event
  // (that only fires in OTHER tabs), so broadcast one ourselves.
  window.dispatchEvent(new CustomEvent("chkplt:cart-changed"));
}

const CartContext = createContext<{
  slugs: string[];
  add: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
}>({ slugs: [], add: () => {}, remove: () => {}, clear: () => {}, has: () => false });

export function CartProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(readCart());
    const onChange = () => setSlugs(readCart());
    window.addEventListener("chkplt:cart-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("chkplt:cart-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const add = (slug: string) => {
    const next = Array.from(new Set([...readCart(), slug]));
    writeCart(next);
    setSlugs(next);
  };
  const remove = (slug: string) => {
    const next = readCart().filter((s) => s !== slug);
    writeCart(next);
    setSlugs(next);
  };
  const clear = () => {
    writeCart([]);
    setSlugs([]);
  };
  const has = (slug: string) => slugs.includes(slug);

  return <CartContext.Provider value={{ slugs, add, remove, clear, has }}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
