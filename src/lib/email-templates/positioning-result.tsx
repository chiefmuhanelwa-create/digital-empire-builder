import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import { emailStyles, SLATE_200, SLATE_500, SLATE_700, AMBER_DEEP } from "./theme";

// Delivery email for the Positioning Brief.
//
// House email rules apply: one call to action, a text link rather than a button
// (a table-based button is a Promotions-tab signal), and the lesson given away
// in full before anything is asked. Nothing here claims a result, quotes a
// figure, or references the founder's story — this email goes to strangers.

export interface PositioningResultProps {
  firstName?: string | null;
  sentence: string;
  passed: number;
  headline: string;
  failing: string[]; // names of the tests that need work
}

export const PositioningResultEmail = ({
  firstName,
  sentence,
  passed,
  headline,
  failing,
}: PositioningResultProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {passed === 5
        ? "All five passed — now put it where people can see it."
        : `${passed} of 5 passed. The brief shows exactly what to fix.`}
    </Preview>
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Text style={emailStyles.brand}>Contentpreneur Africa</Text>

        <Heading style={emailStyles.h1}>
          {firstName ? `${firstName}, here's` : "Here's"} your positioning brief.
        </Heading>

        <Text style={emailStyles.text}>
          It's attached as a PDF. Everything in it came from your own answers — the tests just
          held them up to the light.
        </Text>

        <Section style={{ margin: "18px 0" }}>
          <Text
            style={{
              fontSize: "13px",
              letterSpacing: "2px",
              textTransform: "uppercase" as const,
              color: SLATE_500,
              margin: "0 0 6px",
            }}
          >
            Your sentence
          </Text>
          <Text
            style={{
              fontSize: "17px",
              fontWeight: "700" as const,
              color: SLATE_700,
              lineHeight: "1.45",
              margin: "0",
              borderLeft: `3px solid ${AMBER_DEEP}`,
              paddingLeft: "14px",
            }}
          >
            {sentence}
          </Text>
        </Section>

        <Section style={{ textAlign: "center" as const, margin: "8px 0 18px" }}>
          <Text style={{ fontSize: "40px", fontWeight: "800" as const, color: AMBER_DEEP, margin: "0" }}>
            {passed}/5
          </Text>
          <Text style={{ fontSize: "14px", color: SLATE_700, margin: "4px 0 0" }}>{headline}</Text>
        </Section>

        {failing.length > 0 ? (
          <>
            <Hr style={{ borderColor: SLATE_200, margin: "20px 0" }} />
            <Text style={{ fontSize: "13px", color: SLATE_700, lineHeight: "1.65" }}>
              <strong>What to fix:</strong> {failing.join(", ")}. The brief says exactly why each one
              failed and what to change. Fix them one at a time — most are a single honest sentence
              away from passing.
            </Text>
          </>
        ) : null}

        <Hr style={{ borderColor: SLATE_200, margin: "20px 0" }} />

        <Text style={{ fontSize: "13px", color: SLATE_700, lineHeight: "1.65" }}>
          One thing worth knowing before you go and polish it further: the sentence isn't the work.
          Putting it somewhere public is. It costs nothing to change later, and it does nothing at
          all sitting in a document.
        </Text>

        <Text style={{ fontSize: "13px", color: SLATE_700, lineHeight: "1.65", margin: "16px 0 0" }}>
          Put it in your bio this week. That's the whole assignment.
        </Text>

        <Hr style={{ borderColor: SLATE_200, margin: "20px 0" }} />

        <Text style={{ fontSize: "13px", color: SLATE_500, lineHeight: "1.6" }}>
          If you want the tools that build the offer behind this sentence —{" "}
          <Link href="https://contentpreneur.africa/foundation" style={{ color: AMBER_DEEP }}>
            the Foundation Kit
          </Link>{" "}
          is where that lives.
        </Text>

        <Text style={{ fontSize: "12px", color: SLATE_500, margin: "18px 0 0" }}>
          — Ndivhuwo
        </Text>

        <Text style={{ fontSize: "11px", color: SLATE_500, margin: "20px 0 0", lineHeight: "1.5" }}>
          You received this because you used the positioning tool at contentpreneur.africa.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PositioningResultEmail;
