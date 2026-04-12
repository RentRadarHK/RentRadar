import {
  Html,
  Body,
  Container,
  Button,
  Text,
  Hr,
  Head,
  Preview,
  Section,
} from "@react-email/components";
import * as React from "react";

interface VerificationEmailProps {
  verifyUrl: string;
  reviewId: string;
}

export function VerificationEmail({ verifyUrl, reviewId: _reviewId }: VerificationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Verify your review on RentRadar</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logo}>RentRadar</Text>
          </Section>

          {/* Heading */}
          <Text style={heading}>Verify your review</Text>

          {/* Body copy */}
          <Text style={paragraph}>
            Thanks for submitting your review on RentRadar. Click below to verify
            your email address and publish your review.
          </Text>

          {/* CTA button */}
          <Section style={buttonSection}>
            <Button href={verifyUrl} style={button}>
              Verify my review
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Expiry notice */}
          <Text style={footer}>
            This link expires in 24 hours. If you didn&apos;t submit a review,
            you can safely ignore this email.
          </Text>

          {/* Small footer */}
          <Text style={smallFooter}>
            RentRadar &middot; rentradar.co &middot; Hong Kong
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default VerificationEmail;

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#F5F0E8",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "32px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  maxWidth: "480px",
  margin: "0 auto",
  padding: "40px 40px 32px",
  border: "0.5px solid #E2D9CE",
};

const logoSection: React.CSSProperties = {
  marginBottom: "28px",
};

const logo: React.CSSProperties = {
  color: "#555555",
  fontSize: "18px",
  fontWeight: "800",
  margin: "0",
  letterSpacing: "-0.5px",
};

const heading: React.CSSProperties = {
  color: "#555555",
  fontSize: "22px",
  fontWeight: "800",
  margin: "0 0 12px",
  letterSpacing: "-0.3px",
};

const paragraph: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 28px",
};

const buttonSection: React.CSSProperties = {
  marginBottom: "28px",
};

const button: React.CSSProperties = {
  backgroundColor: "#4D8B6F",
  borderRadius: "999px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 32px",
  textDecoration: "none",
  display: "inline-block",
};

const divider: React.CSSProperties = {
  borderColor: "#E2D9CE",
  margin: "0 0 20px",
};

const footer: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const smallFooter: React.CSSProperties = {
  color: "#C4B8A8",
  fontSize: "11px",
  margin: "0",
};
