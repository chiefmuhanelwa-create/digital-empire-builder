import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OrderReceiptItem {
  title: string;
  quantity: number;
  line_total: string; // pre-formatted (e.g. "R 450")
}

export interface OrderReceiptProps {
  siteName: string;
  siteUrl: string;
  dashboardUrl: string;
  actionUrl?: string | null; // one-click sign-in link (preferred CTA)
  loginUrl?: string;
  hasKit?: boolean;
  customerName?: string | null;
  customerEmail?: string | null;
  orderReference: string;
  items: OrderReceiptItem[];
  total: string;
}

export const OrderReceiptEmail = ({
  siteName,
  siteUrl,
  dashboardUrl,
  actionUrl,
  loginUrl,
  hasKit,
  customerName,
  customerEmail,
  orderReference,
  items,
  total,
}: OrderReceiptProps) => {
  const cta = actionUrl || dashboardUrl;
  const firstName = customerName ? customerName.split(" ")[0] : null;
  const place = hasKit ? "your Foundation Kit" : "your dashboard";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You're in — open {place} and start now</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={kicker}>CONFIRMED · {siteName}</Text>
          <Heading style={h1}>You're in{firstName ? `, ${firstName}` : ""}.</Heading>
          <Text style={text}>
            Payment received and your access is live. Everything you bought lives inside{" "}
            <strong>{place}</strong> — the videos, the interactive apps, and the workbooks. No files to
            wrestle with; just sign in and start.
          </Text>

          <Button style={button} href={cta}>
            Open {place} →
          </Button>
          <Text style={muted}>
            One click — it signs you in automatically. If the link has expired, sign in any time at{" "}
            <Link href={loginUrl || `${siteUrl}/login`} style={link}>
              {(loginUrl || `${siteUrl}/login`).replace("https://", "")}
            </Link>
            {customerEmail ? (
              <>
                {" "}with <strong>{customerEmail}</strong> (use “Forgot password” to set your password).
              </>
            ) : (
              <> with the email you bought with (use “Forgot password” to set your password).</>
            )}
          </Text>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>Here's how to start</Heading>
          <Text style={step}><strong>1.</strong> Tap “Open {place}” above — you'll land signed in.</Text>
          {hasKit ? (
            <>
              <Text style={step}><strong>2.</strong> Start at Step 1 — the <strong>2-minute Readiness Scorecard</strong>.</Text>
              <Text style={step}><strong>3.</strong> Work through the 7 steps — each hands you a finished result (start with <strong>Lock Your Niche</strong>).</Text>
              <Text style={step}><strong>4.</strong> Download each result as you go — you'll finish with your personalised plan.</Text>
            </>
          ) : (
            <Text style={step}><strong>2.</strong> Find your purchase under “Your library” and open it.</Text>
          )}

          <Hr style={hr} />

          <Heading as="h2" style={h2}>Order summary</Heading>
          <Text style={muted}>Reference: {orderReference}</Text>
          <Section>
            {items.map((it, i) => (
              <Text key={i} style={lineItem}>
                <strong>{it.title}</strong>
                {it.quantity > 1 ? ` × ${it.quantity}` : ""} — {it.line_total}
              </Text>
            ))}
            <Text style={totalLine}><strong>Total: {total}</strong></Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Questions? Reply to this email and we'll help. — The {siteName} team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderReceiptEmail;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "20px 25px", maxWidth: "560px" };
const kicker = {
  fontSize: "11px",
  fontWeight: "bold" as const,
  letterSpacing: "0.18em",
  color: "#B45309",
  margin: "0 0 8px",
};
const h1 = {
  fontSize: "26px",
  fontWeight: "bold" as const,
  color: "#0F172A",
  margin: "0 0 16px",
};
const h2 = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#0F172A",
  margin: "24px 0 10px",
};
const text = { fontSize: "15px", color: "#334155", lineHeight: "1.6", margin: "0 0 18px" };
const step = { fontSize: "15px", color: "#334155", lineHeight: "1.6", margin: "0 0 8px" };
const muted = { fontSize: "13px", color: "#64748B", lineHeight: "1.5", margin: "10px 0 0" };
const lineItem = { fontSize: "14px", color: "#334155", margin: "0 0 6px" };
const totalLine = { fontSize: "16px", color: "#0F172A", margin: "16px 0 0" };
const link = { color: "#B45309", textDecoration: "underline" };
const button = {
  backgroundColor: "#F59E0B",
  color: "#0F172A",
  fontSize: "15px",
  fontWeight: "bold" as const,
  borderRadius: "9999px",
  padding: "14px 28px",
  textDecoration: "none",
  display: "inline-block" as const,
};
const hr = { borderColor: "#e2e8f0", margin: "24px 0" };
const footer = { fontSize: "12px", color: "#94a3b8", margin: "12px 0 0" };
