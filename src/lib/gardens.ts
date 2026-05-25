export type Garden = "deshe" | "esev" | "etz_pri" | "devarim";

export const GARDENS: Record<Garden, {
  slug: Garden;
  name: string;
  hebrew: string;
  tagline: string;
  description: string;
  scripture: string;
  priceRange: string;
}> = {
  deshe: {
    slug: "deshe",
    name: "Deshe",
    hebrew: "דֶּשֶׁא",
    tagline: "Tender grass. Ground cover.",
    description:
      "Free products that draw people in. Every one delivers full value — never a diluted teaser.",
    scripture: "Genesis 1:11 — Let the earth bring forth grass.",
    priceRange: "Free",
  },
  esev: {
    slug: "esev",
    name: "Esev",
    hebrew: "עֵשֶׂב",
    tagline: "Herbs yielding seed.",
    description:
      "Paid digital products. Each one solves a specific problem and carries a seed leading to the next.",
    scripture: "Genesis 1:11 — Herb yielding seed.",
    priceRange: "R49 — R999",
  },
  etz_pri: {
    slug: "etz_pri",
    name: "Etz Pri",
    hebrew: "עֵץ פְּרִי",
    tagline: "Fruit trees whose seed is in the fruit.",
    description:
      "Premium courses, cohorts, and mentorship. The transformation IS the fruit; graduates become the next sale.",
    scripture: "Genesis 1:12 — Tree yielding fruit, whose seed was in itself.",
    priceRange: "R4,997 — R100,000",
  },
  devarim: {
    slug: "devarim",
    name: "Devarim",
    hebrew: "דְּבָרִים",
    tagline: "Words. Books that outlive you.",
    description:
      "Books for children's children. A book on a shelf speaks when you're sleeping.",
    scripture: "Deuteronomy 1:1 — These be the words.",
    priceRange: "R199 — R499",
  },
};

export const GARDEN_ORDER: Garden[] = ["deshe", "esev", "etz_pri", "devarim"];

export function formatPrice(cents: number, currency: string, isFree?: boolean) {
  if (isFree || cents === 0) return "Free";
  const symbol = currency === "ZAR" ? "R" : currency === "NGN" ? "₦" : `${currency} `;
  const v = (cents / 100).toLocaleString("en-ZA");
  return `${symbol}${v}`;
}
