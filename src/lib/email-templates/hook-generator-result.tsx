import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import { emailStyles, SLATE_200 } from "./theme";

export interface HookGeneratorResultProps {
  firstName?: string | null;
  topic: string;
  hooks: { type: string; text: string; why: string }[];
}

export const HookGeneratorResultEmail = ({ firstName, topic, hooks }: HookGeneratorResultProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Your ${hooks.length} hooks for "${topic}"`}</Preview>
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Text style={emailStyles.brand}>CHKPLT · Hook Generator</Text>
        <Heading style={emailStyles.h1}>
          {firstName ? `${firstName}, here are` : "Here are"} your hooks.
        </Heading>
        <Text style={emailStyles.text}>
          Written fresh for "{topic}" — copy-paste ready, no templates.
        </Text>

        <Hr style={{ borderColor: SLATE_200, margin: "20px 0" }} />

        {hooks.map((h, i) => (
          <Section key={i} style={{ marginBottom: "16px" }}>
            <Text style={{ fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" as const, color: "#D97706", margin: "0 0 4px", fontWeight: "700" as const }}>
              #{i + 1} · {h.type}
            </Text>
            <Text style={{ fontSize: "16px", color: "#0F172A", margin: "0 0 4px", fontWeight: "600" as const }}>
              {h.text}
            </Text>
            <Text style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>{h.why}</Text>
          </Section>
        ))}

        <Hr style={{ borderColor: SLATE_200, margin: "20px 0" }} />

        <Text style={emailStyles.footer}>
          A hook gets the scroll to stop. CHKPLT's Foundation Kit gives you the full 7-Act post
          structure, the 4E content calendar, and the offer to point all that attention at.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default HookGeneratorResultEmail;
