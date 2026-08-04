import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import { emailStyles } from "./theme";

export interface StarterKitResultProps {
  firstName?: string | null;
  downloadUrl: string;
}

export const StarterKitResultEmail = ({ firstName, downloadUrl }: StarterKitResultProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Knowledge Entrepreneur Starter Kit is here</Preview>
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Text style={emailStyles.brand}>CHKPLT · Starter Kit</Text>
        <Heading style={emailStyles.h1}>
          {firstName ? `${firstName}, you're` : "You're"} in.
        </Heading>
        <Text style={emailStyles.text}>
          7 short worksheets to take you from "I have valuable knowledge but no idea what to do
          with it" to a clear next step. Open it below — most people finish it in one sitting.
        </Text>
        <Button href={downloadUrl} style={emailStyles.button}>
          Open Your Starter Kit
        </Button>
        <Text style={emailStyles.footer}>
          This kit stops at clarity. The Foundation Kit and Accelerator take you the rest of the
          way — contentpreneur.africa/foundation.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default StarterKitResultEmail;
