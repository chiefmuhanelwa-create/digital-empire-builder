// Shared email styling — "Modern Professional" palette (slate ink + amber).
// Kept inline-style-friendly (email clients don't support CSS variables).
// Import these so every transactional email looks consistent with the app.

export const AMBER = "#F59E0B";
export const AMBER_DEEP = "#D97706";
export const SLATE_900 = "#0F172A";
export const SLATE_700 = "#334155";
export const SLATE_500 = "#64748B";
export const SLATE_200 = "#E2E8F0";

export const emailStyles = {
  main: {
    backgroundColor: "#F8FAFC",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    border: `1px solid ${SLATE_200}`,
    borderRadius: "14px",
    padding: "32px 28px",
    maxWidth: "480px",
    margin: "0 auto",
  },
  brand: {
    fontSize: "14px",
    fontWeight: "800" as const,
    letterSpacing: "3px",
    textTransform: "uppercase" as const,
    color: SLATE_900,
    margin: "0 0 24px",
  },
  h1: {
    fontSize: "24px",
    fontWeight: "800" as const,
    color: SLATE_900,
    margin: "0 0 16px",
    lineHeight: 1.2,
  },
  text: {
    fontSize: "16px",
    color: SLATE_700,
    lineHeight: "1.6",
    margin: "0 0 24px",
  },
  button: {
    backgroundColor: AMBER,
    color: SLATE_900,
    fontSize: "16px",
    fontWeight: "700" as const,
    borderRadius: "9999px",
    padding: "13px 26px",
    textDecoration: "none",
    display: "inline-block",
  },
  footer: {
    fontSize: "13px",
    color: SLATE_500,
    margin: "28px 0 0",
    lineHeight: "1.5",
  },
} as const;
