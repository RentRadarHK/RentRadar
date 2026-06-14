import Link from "next/link";

interface Props {
  searchParams: { action?: string; property?: string; type?: string; status?: string };
}

export const metadata = {
  title: "Review Moderated — RentRadar",
};

export default function ModeratedPage({ searchParams }: Props) {
  const { action, property, type, status } = searchParams;
  const isResponse = type === "response";
  const approved =
    action === "approve" ||
    action === "approved" ||
    status === "approved";

  const heading = isResponse
    ? approved
      ? "Response approved"
      : "Response rejected"
    : approved
      ? "Review approved"
      : "Review rejected";

  const body = isResponse
    ? approved
      ? "The landlord response is now live on the review."
      : "The landlord response has been rejected and will not be published."
    : approved
      ? property
        ? `The review is now live on ${property}.`
        : "The review is now live on RentRadar."
      : "The review has been rejected and will not be published.";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F5F0E8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "48px 40px",
          maxWidth: "440px",
          width: "100%",
          border: "1px solid #E2D9CE",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: approved ? "#DCFCE7" : "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "28px",
          }}
        >
          {approved ? "✓" : "✕"}
        </div>

        <h1
          style={{
            color: "#111827",
            fontSize: "22px",
            fontWeight: "800",
            margin: "0 0 12px",
          }}
        >
          {heading}
        </h1>

        <p style={{ color: "#6B7280", fontSize: "15px", lineHeight: "1.6", margin: "0 0 32px" }}>
          {body}
        </p>

        <Link
          href="https://rentradar.co"
          style={{
            display: "inline-block",
            background: "#4D8B6F",
            color: "white",
            fontSize: "14px",
            fontWeight: "600",
            padding: "12px 28px",
            borderRadius: "999px",
            textDecoration: "none",
          }}
        >
          Back to RentRadar
        </Link>
      </div>
    </main>
  );
}
