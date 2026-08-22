import * as React from "react";
import { pathTools } from "@/lib/kit-catalog";
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

// Generated once per render from the single source of truth.
const PATH = pathTools();

interface OrderReceiptItem {
  title: string;
  quantity: number;
  line_total: string; // pre-formatted (e.g. "R 450")
  downloadUrl?: string | null;
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
  const downloadableItems = items.filter((it) => it.downloadUrl);
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {downloadableItems.length > 0 ? "Your download is ready — right in this email" : `You're in — open ${place} and start now`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandBarText}>{siteName}</Text>
          </Section>

          <Section style={{ padding: "32px 32px 8px" }}>
            <Text style={kicker}>PAYMENT CONFIRMED</Text>
            <Heading style={h1}>You're in{firstName ? `, ${firstName}` : ""}.</Heading>
            <Text style={text}>
              {downloadableItems.length > 0
                ? "Your payment went through and your files are ready below — no login needed, just tap and download."
                : `Payment received and your access is live. Everything you bought lives inside ${place} — the videos, the interactive apps, and the workbooks.`}
            </Text>

            {/* Direct download per item — the product itself, delivered here. */}
            {downloadableItems.length > 0 && (
              <Section style={downloadBox}>
                {downloadableItems.map((it, i) => (
                  <Section key={i} style={i > 0 ? { marginTop: "14px" } : undefined}>
                    <Text style={downloadTitle}>{it.title}</Text>
                    <Button style={downloadButton} href={it.downloadUrl!}>
                      Download now →
                    </Button>
                  </Section>
                ))}
                <Text style={downloadNote}>
                  These links work for 7 days. After that, sign in at{" "}
                  <Link href={loginUrl || `${siteUrl}/login`} style={link}>
                    {(loginUrl || `${siteUrl}/login`).replace("https://", "")}
                  </Link>{" "}
                  and grab a fresh one from your dashboard any time — it's yours for good.
                </Text>
              </Section>
            )}

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
                  {" "}with <strong>{customerEmail}</strong> (use "Forgot password" to set your password).
                </>
              ) : (
                <> with the email you bought with (use "Forgot password" to set your password).</>
              )}
            </Text>

            <Hr style={hr} />

            {/* THE FIRST INSTRUCTION A BUYER EVER RECEIVES, and until 2026-08-22
                it described a product that no longer existed: "7 steps", a
                "2-minute Readiness Scorecard", "Lock Your Niche". The path had
                been rebuilt twice underneath it.

                So it is no longer written by hand. It is generated from
                kit-catalog.ts — the same source the workspace renders from —
                which means the email cannot drift from the product again. */}
            {hasKit ? (
              <>
                <Heading as="h2" style={h2}>Here's how to start</Heading>
                <Text style={step}>
                  <strong>1.</strong> Tap "Open {place}" above — you'll land signed in.
                </Text>
                <Text style={step}>
                  <strong>2.</strong> Start at step 1, <strong>{PATH[0]?.name}</strong>. It takes an
                  evening and it hands you something you can point at.
                </Text>
                <Text style={step}>
                  <strong>3.</strong> Work through all {PATH.length} in order:{" "}
                  {PATH.map((t) => t.name).join(" → ")}.
                </Text>
                <Text style={step}>
                  <strong>4.</strong> Your answers save as you go, so you can start on your phone and
                  finish on a laptop. Nothing needs typing twice.
                </Text>
                <Text style={step}>
                  It ends the day somebody pays you. That is the whole point of it.
                </Text>
                <Hr style={hr} />
              </>
            ) : null}

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
          </Section>

          <Section style={brandFooter}>
            <Text style={brandFooterText}>{siteName} · NOCHILL PTY LTD</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderReceiptEmail;

// NOCHILL brand palette — Heritage Gold #C9A84C, Charcoal #1C1C1C, Cream #FAF7F0.
const GOLD = "#C9A84C";
const CHARCOAL = "#1C1C1C";

const main = { backgroundColor: "#F1EFEA", fontFamily: "Georgia, 'Times New Roman', serif" };
const container = { maxWidth: "560px", margin: "0 auto" };
const brandBar = { backgroundColor: CHARCOAL, padding: "20px 32px" };
const brandBarText = {
  fontSize: "13px",
  fontWeight: "bold" as const,
  letterSpacing: "0.28em",
  color: GOLD,
  margin: 0,
  textTransform: "uppercase" as const,
};
const kicker = {
  fontSize: "11px",
  fontWeight: "bold" as const,
  letterSpacing: "0.18em",
  color: GOLD,
  margin: "8px 0 8px",
};
const h1 = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "28px",
  fontWeight: "bold" as const,
  color: CHARCOAL,
  margin: "0 0 16px",
};
const h2 = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: CHARCOAL,
  margin: "24px 0 10px",
};
const text = { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: "15px", color: "#3F3A32", lineHeight: "1.6", margin: "0 0 18px" };
const step = { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: "15px", color: "#3F3A32", lineHeight: "1.6", margin: "0 0 8px" };
const muted = { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: "13px", color: "#7A7466", lineHeight: "1.5", margin: "10px 0 0" };
const lineItem = { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: "14px", color: "#3F3A32", margin: "0 0 6px" };
const totalLine = { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: "16px", color: CHARCOAL, margin: "16px 0 0" };
const link = { color: "#8A6D1F", textDecoration: "underline" };
const button = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  backgroundColor: GOLD,
  color: "#1C1C1C",
  fontSize: "15px",
  fontWeight: "bold" as const,
  borderRadius: "8px",
  padding: "14px 28px",
  textDecoration: "none",
  display: "inline-block" as const,
};
const downloadBox = {
  backgroundColor: "#FAF7F0",
  border: `2px solid ${GOLD}`,
  borderRadius: "10px",
  padding: "20px",
  margin: "20px 0",
};
const downloadTitle = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "15px",
  fontWeight: "bold" as const,
  color: CHARCOAL,
  margin: "0 0 10px",
};
const downloadButton = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  backgroundColor: CHARCOAL,
  color: GOLD,
  fontSize: "14px",
  fontWeight: "bold" as const,
  borderRadius: "8px",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block" as const,
};
const downloadNote = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "12px",
  color: "#7A7466",
  lineHeight: "1.5",
  margin: "16px 0 0",
};
const hr = { borderColor: "#E4DFD3", margin: "24px 0" };
const footer = { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: "12px", color: "#A39C8C", margin: "12px 0 0" };
const brandFooter = { backgroundColor: CHARCOAL, padding: "18px 32px" };
const brandFooterText = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "11px",
  letterSpacing: "0.08em",
  color: "#8A8578",
  margin: 0,
  textAlign: "center" as const,
};
