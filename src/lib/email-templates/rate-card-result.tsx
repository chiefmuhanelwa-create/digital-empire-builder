import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import { emailStyles, SLATE_200 } from "./theme";

export interface RateCardResultProps {
  firstName?: string | null;
  niche: string;
  total: string;
  low: string;
  high: string;
  deliverable: string;
  breakdown: { label: string; value: string }[];
  marketNote: string;
}

export const RateCardResultEmail = ({
  firstName,
  niche,
  total,
  low,
  high,
  deliverable,
  breakdown,
  marketNote,
}: RateCardResultProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your rate card: {total} per {deliverable}</Preview>
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Text style={emailStyles.brand}>CHKPLT · Rate Card</Text>
        <Heading style={emailStyles.h1}>
          {firstName ? `${firstName}, here's` : "Here's"} your number.
        </Heading>
        <Text style={emailStyles.text}>
          Built on real South African CPM benchmarks for {niche}, your engagement, and the deliverable.
          Walk into the negotiation with a defensible rate — not a guess.
        </Text>

        <Section style={{ textAlign: "center" as const, margin: "8px 0 20px" }}>
          <Text style={{ fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase" as const, color: "#64748B", margin: "0 0 4px" }}>
            Recommended rate
          </Text>
          <Text style={{ fontSize: "40px", fontWeight: "800" as const, color: "#D97706", margin: "0" }}>
            {total}
          </Text>
          <Text style={{ fontSize: "14px", color: "#334155", margin: "6px 0 0" }}>
            Negotiation range {low} — {high} per {deliverable}
          </Text>
        </Section>

        <Hr style={{ borderColor: SLATE_200, margin: "20px 0" }} />

        {breakdown.map((row, i) => (
          <Section key={i} style={{ display: "flex" as const, justifyContent: "space-between" as const, marginBottom: "8px" }}>
            <Text style={{ fontSize: "14px", color: "#334155", margin: 0, display: "inline-block" as const }}>
              {row.label}: <strong>{row.value}</strong>
            </Text>
          </Section>
        ))}

        <Hr style={{ borderColor: SLATE_200, margin: "20px 0" }} />

        <Text style={{ fontSize: "13px", color: "#64748B", lineHeight: "1.6" }}>
          <strong>{niche} — SA market note:</strong> {marketNote}
        </Text>

        <Text style={emailStyles.footer}>
          Now go close the deal — CHKPLT's Foundation Kit has the rate-card template, the "I don't do
          freebies" reply script, and the system to turn one brand reply into a recurring retainer.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default RateCardResultEmail;
