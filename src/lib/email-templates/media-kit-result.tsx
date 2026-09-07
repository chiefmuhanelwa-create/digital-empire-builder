import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import { emailStyles, SLATE_200 } from "./theme";

interface Premium {
  positioning?: string;
  oneLineProof?: string;
  formats?: string;
  audiencePsychographics?: string;
  audienceBuying?: string;
  audienceCities?: string;
  audienceInterests?: string;
  authenticity?: string;
  caseStudies?: { brand: string; objective: string; whatWeDid: string; result: string }[];
  testimonials?: { quote: string; author: string }[];
  packages?: { tier: string; name: string; includes: string; startingAt: string }[];
  addons?: string[];
  rightsUsage?: string;
  rightsWhitelisting?: string;
  rightsExclusivity?: string;
  termsTurnaround?: string;
  termsRevisions?: string;
  termsComms?: string;
  paymentTerms?: string;
  availability?: string;
  press?: string;
  currency?: string;
  lastUpdated?: string;
}

export interface MediaKitResultProps {
  name: string;
  handle: string;
  tagline: string;
  bio: string;
  location?: string;
  niches?: string;
  platforms: { name: string; followers: string; er: string; avgViews?: string; growth?: string; verifiedOn?: string }[];
  targetAudience?: string;
  ageBracket?: string;
  genderSplit?: string;
  pillars: { name: string; desc: string }[];
  rates: { name: string; price: string }[];
  statLines: string[];
  brands?: string;
  email: string;
  booking: string;
  premium?: Premium;
}

const sectionLabel = {
  fontSize: "13px",
  fontWeight: "700" as const,
  color: "#0F172A",
  margin: "0 0 8px",
};
const line = { fontSize: "14px", color: "#334155", margin: "0 0 4px" };
const rule = { borderColor: SLATE_200, margin: "16px 0" };

export const MediaKitResultEmail = ({
  name,
  handle,
  tagline,
  bio,
  location,
  niches,
  platforms,
  targetAudience,
  ageBracket,
  genderSplit,
  pillars,
  rates,
  statLines,
  brands,
  email,
  booking,
  premium,
}: MediaKitResultProps) => {
  const brandList = (brands ?? "").split(",").map((b) => b.trim()).filter(Boolean);
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your media kit — {name}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Text style={emailStyles.brand}>CHKPLT · Media Kit</Text>
          <Heading style={emailStyles.h1}>{name}</Heading>
          <Text style={{ fontSize: "14px", color: "#D97706", margin: "-12px 0 16px" }}>
            {handle}
            {location ? ` · ${location}` : ""}
          </Text>
          {premium?.positioning && <Text style={emailStyles.text}>{premium.positioning}</Text>}
          {premium?.oneLineProof && (
            <Text style={{ ...emailStyles.text, fontWeight: "700" as const }}>{premium.oneLineProof}</Text>
          )}
          {tagline && <Text style={emailStyles.text}>{tagline}</Text>}
          {bio && <Text style={{ ...emailStyles.text, fontSize: "14px" }}>{bio}</Text>}
          {niches && <Text style={line}>Niches: {niches}</Text>}

          {platforms.length > 0 && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Platforms & reach</Text>
              {platforms.map((p, i) => (
                <Text key={i} style={line}>
                  {p.name}: <strong>{p.followers}</strong>
                  {p.avgViews ? ` · ${p.avgViews} avg views` : ""}
                  {p.er ? ` · ${p.er}% ER` : ""}
                  {p.growth ? ` · ${p.growth} growth` : ""}
                  {p.verifiedOn ? ` (verified ${p.verifiedOn})` : ""}
                </Text>
              ))}
            </>
          )}

          {(targetAudience || genderSplit || premium?.audiencePsychographics) && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Audience</Text>
              {targetAudience && <Text style={line}>{targetAudience}</Text>}
              {(ageBracket || genderSplit) && (
                <Text style={line}>
                  Core: {ageBracket}
                  {genderSplit ? ` · ${genderSplit}` : ""}
                </Text>
              )}
              {premium?.audienceCities && <Text style={line}>Top locations: {premium.audienceCities}</Text>}
              {premium?.audienceInterests && <Text style={line}>Interests: {premium.audienceInterests}</Text>}
              {premium?.audiencePsychographics && <Text style={line}>{premium.audiencePsychographics}</Text>}
              {premium?.audienceBuying && (
                <Text style={line}>
                  <strong>Buying behaviour:</strong> {premium.audienceBuying}
                </Text>
              )}
              {premium?.authenticity && <Text style={line}>Authenticity: {premium.authenticity}</Text>}
            </>
          )}

          {pillars.length > 0 && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Content pillars</Text>
              {pillars.map((p, i) => (
                <Text key={i} style={line}>
                  <strong>{p.name}</strong>
                  {p.desc ? ` — ${p.desc}` : ""}
                </Text>
              ))}
              {premium?.formats && <Text style={line}>Best formats: {premium.formats}</Text>}
            </>
          )}

          {premium?.caseStudies && premium.caseStudies.length > 0 && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Case studies</Text>
              {premium.caseStudies.map((c, i) => (
                <Section key={i} style={{ margin: "0 0 10px" }}>
                  <Text style={{ ...line, fontWeight: "700" as const, margin: "0 0 2px" }}>{c.brand}</Text>
                  {c.objective && <Text style={line}>Objective: {c.objective}</Text>}
                  {c.whatWeDid && <Text style={line}>What we did: {c.whatWeDid}</Text>}
                  {c.result && (
                    <Text style={{ ...line, color: "#0F172A" }}>
                      <strong>Result: {c.result}</strong>
                    </Text>
                  )}
                </Section>
              ))}
            </>
          )}

          {premium?.testimonials && premium.testimonials.length > 0 && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>What partners say</Text>
              {premium.testimonials.map((t, i) => (
                <Text key={i} style={line}>
                  “{t.quote}”{t.author ? ` — ${t.author}` : ""}
                </Text>
              ))}
            </>
          )}

          {statLines.length > 0 && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Why brands work with me</Text>
              {statLines.map((s, i) => (
                <Text key={i} style={line}>
                  • {s}
                </Text>
              ))}
            </>
          )}

          {rates.length > 0 && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Rate card{premium?.currency ? ` (${premium.currency})` : ""}</Text>
              {rates.map((r, i) => (
                <Text key={i} style={line}>
                  {r.name}: <strong>{r.price || "—"}</strong>
                </Text>
              ))}
            </>
          )}

          {premium?.packages && premium.packages.length > 0 && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Packages</Text>
              {premium.packages.map((p, i) => (
                <Section key={i} style={{ margin: "0 0 8px" }}>
                  <Text style={{ ...line, fontWeight: "700" as const, margin: "0 0 2px" }}>
                    {p.tier}
                    {p.name ? ` — ${p.name}` : ""}
                    {p.startingAt ? ` · from ${p.startingAt}` : ""}
                  </Text>
                  {p.includes && <Text style={line}>{p.includes}</Text>}
                </Section>
              ))}
            </>
          )}

          {premium?.addons && premium.addons.length > 0 && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Available add-ons</Text>
              <Text style={line}>{premium.addons.join(" · ")}</Text>
            </>
          )}

          {(premium?.rightsUsage || premium?.rightsWhitelisting || premium?.rightsExclusivity) && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Usage, whitelisting & exclusivity</Text>
              {premium.rightsUsage && <Text style={line}>Usage rights: {premium.rightsUsage}</Text>}
              {premium.rightsWhitelisting && <Text style={line}>Whitelisting: {premium.rightsWhitelisting}</Text>}
              {premium.rightsExclusivity && <Text style={line}>Exclusivity: {premium.rightsExclusivity}</Text>}
            </>
          )}

          {(premium?.termsTurnaround || premium?.termsRevisions || premium?.termsComms || premium?.paymentTerms) && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Working with me</Text>
              {premium.termsTurnaround && <Text style={line}>Turnaround: {premium.termsTurnaround}</Text>}
              {premium.termsRevisions && <Text style={line}>Revisions: {premium.termsRevisions}</Text>}
              {premium.termsComms && <Text style={line}>Comms: {premium.termsComms}</Text>}
              {premium.paymentTerms && <Text style={line}>Payment: {premium.paymentTerms}</Text>}
            </>
          )}

          {premium?.press && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Press & authority</Text>
              <Text style={line}>{premium.press}</Text>
            </>
          )}

          {brandList.length > 0 && (
            <>
              <Hr style={rule} />
              <Text style={sectionLabel}>Trusted by</Text>
              <Text style={line}>{brandList.join(" · ")}</Text>
            </>
          )}

          <Hr style={rule} />
          <Text style={{ fontSize: "13px", color: "#64748B" }}>
            {email}
            {email && booking ? " · " : ""}
            {booking}
          </Text>
          {premium?.availability && (
            <Text style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0" }}>{premium.availability}</Text>
          )}
          {premium?.lastUpdated && (
            <Text style={{ fontSize: "12px", color: "#94A3B8", margin: "4px 0 0" }}>
              Last updated {premium.lastUpdated}
            </Text>
          )}

          <Text style={emailStyles.footer}>
            A kit gets the meeting. CHKPLT's Foundation Kit hands you the pitch email, the negotiation
            scripts, and the path from one brand reply to a recurring retainer.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MediaKitResultEmail;
