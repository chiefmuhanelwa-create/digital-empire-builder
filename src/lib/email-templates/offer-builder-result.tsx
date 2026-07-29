import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import { emailStyles, SLATE_200 } from "./theme";
import type { GeneratedOffer } from "@/lib/offer-builder.functions";

export interface OfferBuilderResultProps {
  firstName?: string | null;
  offer: GeneratedOffer;
}

export const OfferBuilderResultEmail = ({ firstName, offer }: OfferBuilderResultProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Your offer: ${offer.offerName}`}</Preview>
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Text style={emailStyles.brand}>CHKPLT · Offer Builder</Text>
        <Heading style={emailStyles.h1}>
          {firstName ? `${firstName}, here's` : "Here's"} your offer.
        </Heading>
        <Text style={{ fontSize: "20px", fontWeight: "800" as const, color: "#0F172A", margin: "8px 0 0" }}>
          {offer.offerName}
        </Text>
        <Text style={emailStyles.text}>{offer.headline}</Text>

        <Hr style={{ borderColor: SLATE_200, margin: "20px 0" }} />

        <Text style={{ fontSize: "13px", fontWeight: "700" as const, color: "#D97706", margin: "0 0 4px", textTransform: "uppercase" as const }}>Who it's for</Text>
        <Text style={emailStyles.text}>{offer.whoItsFor}</Text>

        <Text style={{ fontSize: "13px", fontWeight: "700" as const, color: "#D97706", margin: "16px 0 4px", textTransform: "uppercase" as const }}>Transformation</Text>
        <Text style={emailStyles.text}>{offer.transformation.before} → {offer.transformation.after}</Text>

        <Text style={{ fontSize: "13px", fontWeight: "700" as const, color: "#D97706", margin: "16px 0 4px", textTransform: "uppercase" as const }}>Deliverables</Text>
        {offer.deliverables.map((d, i) => (
          <Text key={i} style={{ fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>• {d}</Text>
        ))}

        <Section style={{ textAlign: "center" as const, margin: "20px 0" }}>
          <Text style={{ fontSize: "28px", fontWeight: "800" as const, color: "#D97706", margin: 0 }}>{offer.pricing.suggestion}</Text>
          <Text style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0" }}>{offer.pricing.rationale}</Text>
        </Section>

        <Hr style={{ borderColor: SLATE_200, margin: "20px 0" }} />

        <Text style={{ fontSize: "13px", fontWeight: "700" as const, color: "#D97706", margin: "0 0 4px", textTransform: "uppercase" as const }}>This week</Text>
        <Text style={emailStyles.text}>{offer.thisWeekAction}</Text>

        <Text style={emailStyles.footer}>
          A clear offer is step one. The Foundation Kit gives you the checkout, the delivery system,
          and the content engine to actually sell it.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OfferBuilderResultEmail;
