import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import { emailStyles, SLATE_200 } from "./theme";

export interface MediaKitResultProps {
  name: string;
  handle: string;
  tagline: string;
  bio: string;
  platforms: { name: string; followers: string; er: string }[];
  pillars: { name: string; desc: string }[];
  rates: { name: string; price: string }[];
  statLines: string[];
  email: string;
  booking: string;
}

export const MediaKitResultEmail = ({
  name,
  handle,
  tagline,
  bio,
  platforms,
  pillars,
  rates,
  statLines,
  email,
  booking,
}: MediaKitResultProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your media kit — {name}</Preview>
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Text style={emailStyles.brand}>CHKPLT · Media Kit</Text>
        <Heading style={emailStyles.h1}>{name}</Heading>
        <Text style={{ fontSize: "14px", color: "#D97706", margin: "-12px 0 16px" }}>
          {handle}
        </Text>
        {tagline && <Text style={emailStyles.text}>{tagline}</Text>}
        {bio && <Text style={{ ...emailStyles.text, fontSize: "14px" }}>{bio}</Text>}

        {platforms.length > 0 && (
          <>
            <Hr style={{ borderColor: SLATE_200, margin: "16px 0" }} />
            <Text style={{ fontSize: "13px", fontWeight: "700" as const, color: "#0F172A", margin: "0 0 8px" }}>Platforms & reach</Text>
            {platforms.map((p, i) => (
              <Text key={i} style={{ fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>
                {p.name}: <strong>{p.followers}</strong>{p.er ? ` (${p.er}% ER)` : ""}
              </Text>
            ))}
          </>
        )}

        {pillars.length > 0 && (
          <>
            <Hr style={{ borderColor: SLATE_200, margin: "16px 0" }} />
            <Text style={{ fontSize: "13px", fontWeight: "700" as const, color: "#0F172A", margin: "0 0 8px" }}>Content pillars</Text>
            {pillars.map((p, i) => (
              <Text key={i} style={{ fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>
                <strong>{p.name}</strong>{p.desc ? ` — ${p.desc}` : ""}
              </Text>
            ))}
          </>
        )}

        {statLines.length > 0 && (
          <>
            <Hr style={{ borderColor: SLATE_200, margin: "16px 0" }} />
            <Text style={{ fontSize: "13px", fontWeight: "700" as const, color: "#0F172A", margin: "0 0 8px" }}>Why brands work with me</Text>
            {statLines.map((s, i) => (
              <Text key={i} style={{ fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>• {s}</Text>
            ))}
          </>
        )}

        {rates.length > 0 && (
          <>
            <Hr style={{ borderColor: SLATE_200, margin: "16px 0" }} />
            <Text style={{ fontSize: "13px", fontWeight: "700" as const, color: "#0F172A", margin: "0 0 8px" }}>Rate card</Text>
            {rates.map((r, i) => (
              <Text key={i} style={{ fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>
                {r.name}: <strong>{r.price || "—"}</strong>
              </Text>
            ))}
          </>
        )}

        <Hr style={{ borderColor: SLATE_200, margin: "16px 0" }} />
        <Text style={{ fontSize: "13px", color: "#64748B" }}>
          {email}{email && booking ? " · " : ""}{booking}
        </Text>

        <Text style={emailStyles.footer}>
          A kit gets the meeting. CHKPLT's Foundation Kit hands you the pitch email, the negotiation
          scripts, and the path from one brand reply to a recurring retainer.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default MediaKitResultEmail;
