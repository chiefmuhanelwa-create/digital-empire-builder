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
  customerName?: string | null;
  orderReference: string;
  items: OrderReceiptItem[];
  total: string;
}

export const OrderReceiptEmail = ({
  siteName,
  siteUrl,
  dashboardUrl,
  customerName,
  orderReference,
  items,
  total,
}: OrderReceiptProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} order is confirmed — access your downloads</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Order confirmed</Heading>
        <Text style={text}>
          {customerName ? `Hi ${customerName},` : "Hi,"} thanks for your purchase from{" "}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          .
        </Text>
        <Text style={text}>
          Your access is live. Click the button below to sign in and download your files.
          For security, downloads are served from time-expiring links inside your dashboard
          — please do not share them.
        </Text>
        <Button style={button} href={dashboardUrl}>
          Go to your dashboard
        </Button>

        <Hr style={hr} />

        <Heading as="h2" style={h2}>
          Order summary
        </Heading>
        <Text style={muted}>Reference: {orderReference}</Text>
        <Section>
          {items.map((it, i) => (
            <Text key={i} style={lineItem}>
              <strong>{it.title}</strong>
              {it.quantity > 1 ? ` × ${it.quantity}` : ""} — {it.line_total}
            </Text>
          ))}
          <Text style={totalLine}>
            <strong>Total: {total}</strong>
          </Text>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Questions? Reply to this email and we'll help. — The {siteName} team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OrderReceiptEmail;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "20px 25px", maxWidth: "560px" };
const h1 = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#000000",
  margin: "0 0 20px",
};
const h2 = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#000000",
  margin: "24px 0 8px",
};
const text = { fontSize: "14px", color: "#333333", lineHeight: "1.6", margin: "0 0 16px" };
const muted = { fontSize: "12px", color: "#888888", margin: "0 0 12px" };
const lineItem = { fontSize: "14px", color: "#333333", margin: "0 0 6px" };
const totalLine = { fontSize: "16px", color: "#000000", margin: "16px 0 0" };
const link = { color: "inherit", textDecoration: "underline" };
const button = {
  backgroundColor: "#000000",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none",
  display: "inline-block" as const,
};
const hr = { borderColor: "#e6e6e6", margin: "24px 0" };
const footer = { fontSize: "12px", color: "#999999", margin: "12px 0 0" };
