import * as React from "react";
import {
  Body,
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
import { emailStyles, SLATE_200, SLATE_500, SLATE_700, AMBER_DEEP } from "./theme";

export interface TaxResultEmailProps {
  firstName?: string | null;
  taxYear: string;
  taxable: string;
  annualTax: string;
  firstPayment: string;
  secondPayment: string;
  monthly: string;
  effectiveRate: string;
  belowThreshold: boolean;
}

export const TaxResultEmail = ({
  firstName,
  taxYear,
  taxable,
  annualTax,
  firstPayment,
  secondPayment,
  monthly,
  effectiveRate,
  belowThreshold,
}: TaxResultEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {belowThreshold
        ? "You're under the tax threshold — here's your estimate anyway."
        : `Set aside ${monthly} a month. First payment ${firstPayment} by 31 August.`}
    </Preview>
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Text style={emailStyles.brand}>CHKPLT · Provisional Tax</Text>
        <Heading style={emailStyles.h1}>
          {firstName ? `${firstName}, here's` : "Here's"} your number.
        </Heading>

        <Text style={emailStyles.text}>
          Your provisional tax estimate for the <strong>{taxYear}</strong> tax year is attached as a
          PDF — the full breakdown, the SARS bracket table, and your two payment dates. Send it
          straight to your accountant, or keep it for your own filing.
        </Text>

        {belowThreshold ? (
          <Section
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "10px",
              padding: "16px 18px",
              margin: "8px 0 20px",
            }}
          >
            <Text style={{ fontSize: "15px", color: "#166534", margin: 0, lineHeight: "1.6" }}>
              On these figures you're <strong>below the tax threshold</strong>, so your estimated
              tax is nil. That can change with one good month — keep the record, and re-run it when
              it does.
            </Text>
          </Section>
        ) : (
          <>
            <Section style={{ textAlign: "center" as const, margin: "8px 0 20px" }}>
              <Text
                style={{
                  fontSize: "13px",
                  letterSpacing: "2px",
                  textTransform: "uppercase" as const,
                  color: SLATE_500,
                  margin: "0 0 4px",
                }}
              >
                Tax for the year
              </Text>
              <Text
                style={{
                  fontSize: "40px",
                  fontWeight: "800" as const,
                  color: AMBER_DEEP,
                  margin: 0,
                }}
              >
                {annualTax}
              </Text>
              <Text style={{ fontSize: "14px", color: SLATE_700, margin: "6px 0 0" }}>
                On {taxable} taxable income · {effectiveRate} effective rate
              </Text>
            </Section>

            <Section
              style={{
                background: "#FDF8EE",
                border: "1px solid #E4CE93",
                borderRadius: "10px",
                padding: "16px 18px",
                margin: "0 0 20px",
              }}
            >
              <Text style={{ fontSize: "14px", color: SLATE_700, margin: 0, lineHeight: "1.7" }}>
                <strong>1st provisional (IRP6): {firstPayment}</strong> — due by 31 August
                <br />
                <strong>2nd provisional (IRP6): {secondPayment}</strong> — due by the last day of
                February
              </Text>
            </Section>

            <Text style={{ fontSize: "15px", color: SLATE_700, lineHeight: "1.7" }}>
              The habit that makes this painless: move <strong>{monthly}</strong> into a separate
              account the day money lands. When SARS comes, it's already sitting there.
            </Text>
          </>
        )}

        <Hr style={{ borderColor: SLATE_200, margin: "20px 0" }} />

        <Text style={{ fontSize: "14px", color: SLATE_700, lineHeight: "1.7" }}>
          I learned this the expensive way. An assessment of <strong>R207,879</strong> landed
          because nothing had been set aside — I came forward, corrected it, and SARS waived{" "}
          <strong>R45,705</strong> in penalties. It was survivable. Not knowing is what costs you.{" "}
          <Link
            href="https://chkplt.com/products/sars-creator-income"
            style={{ color: AMBER_DEEP, fontWeight: 600 }}
          >
            SARS &amp; Creator Income
          </Link>{" "}
          is the full picture — what's deductible, how to register, and how to never be surprised
          again.
        </Text>

        <Text style={{ fontSize: "12px", color: SLATE_500, lineHeight: "1.6", marginTop: "18px" }}>
          This is an estimate to help you plan and reserve — not tax advice. Confirm your figures
          with a registered tax practitioner before you file.
        </Text>

        <Text style={emailStyles.footer}>chkplt.com · NOCHILL PTY LTD</Text>
      </Container>
    </Body>
  </Html>
);

export default TaxResultEmail;
