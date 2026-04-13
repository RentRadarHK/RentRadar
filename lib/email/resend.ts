import { Resend } from "resend";

// ── Verification email ────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  reviewId: string,
  token: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/reviews/verify?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your RentRadar review</title>
    </head>
    <body style="background:#F5F0E8;font-family:Arial,sans-serif;margin:0;padding:40px 20px;">
      <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;padding:40px;border:1px solid #E2D9CE;">
        <h1 style="color:#555555;font-size:24px;margin:0 0 8px;">RentRadar</h1>
        <hr style="border:none;border-top:1px solid #E2D9CE;margin:20px 0;">
        <h2 style="color:#555555;font-size:20px;margin:0 0 16px;">Verify your review</h2>
        <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Thanks for submitting your review on RentRadar.
          Click below to verify your email address and publish your review.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#4D8B6F;color:white;font-size:15px;font-weight:600;padding:14px 32px;border-radius:999px;text-decoration:none;">
          Verify my review
        </a>
        <p style="color:#9CA3AF;font-size:13px;margin:24px 0 0;">
          This link expires in 24 hours. If you didn't submit a review, ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #E2D9CE;margin:24px 0 16px;">
        <p style="color:#9CA3AF;font-size:12px;margin:0;">
          RentRadar &middot; rentradar.co &middot; Hong Kong
        </p>
      </div>
    </body>
    </html>
  `;

  const { error } = await resend.emails.send({
    from: "RentRadar <noreply@rentradar.co>",
    to: email,
    subject: "Verify your RentRadar review",
    html,
  });

  if (error) {
    console.error("Resend error:", JSON.stringify(error));
    throw new Error(JSON.stringify(error));
  }

  console.log("Verification email sent to:", email);
}

// ── Moderation email ──────────────────────────────────────────────────────────

interface ModerationEmailParams {
  reviewId: string;
  moderationToken: string;
  propertyName: string;
  propertyType: "building" | "landlord";
  reviewText: string;
  ratingOverall: number;
  ratingDeposit: number;
  ratingMaintenance: number;
  ratingResponsiveness: number;
  ratingAccuracy: number;
  tenancyFrom?: number;
  tenancyTo?: number;
  currentlyRenting?: boolean;
  monthlyRent?: number;
  verifiedTenant: boolean;
  verificationMethod: string;
  reviewerEmail?: string;
}

function stars(n: number): string {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 12px;color:#6B7280;font-size:13px;white-space:nowrap;border-bottom:1px solid #F3F4F6;">${label}</td>
      <td style="padding:8px 12px;color:#111827;font-size:13px;border-bottom:1px solid #F3F4F6;">${value}</td>
    </tr>`;
}

export async function sendModerationEmail(params: ModerationEmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rentradar.co";

  const approveUrl = `${siteUrl}/api/reviews/moderate?action=approve&id=${params.reviewId}&token=${params.moderationToken}`;
  const rejectUrl  = `${siteUrl}/api/reviews/moderate?action=reject&id=${params.reviewId}&token=${params.moderationToken}`;

  const tenancyStr = params.currentlyRenting
    ? `${params.tenancyFrom ?? "?"} – Present`
    : params.tenancyFrom
    ? `${params.tenancyFrom} – ${params.tenancyTo ?? "?"}`
    : "Not specified";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New review to moderate</title>
    </head>
    <body style="background:#F5F0E8;font-family:Arial,sans-serif;margin:0;padding:40px 20px;">
      <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;padding:40px;border:1px solid #E2D9CE;">

        <p style="color:#9CA3AF;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">RentRadar · New Review</p>
        <h1 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 4px;">${params.propertyName}</h1>
        <p style="color:#4D8B6F;font-size:20px;margin:0 0 24px;letter-spacing:0.05em;">${stars(params.ratingOverall)}</p>

        <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <tbody>
            ${row("Property", params.propertyName + (params.propertyType === "building" ? " (Building)" : " (Landlord)"))}
            ${row("Tenancy", tenancyStr)}
            ${row("Overall", `${params.ratingOverall}/5 &nbsp;${stars(params.ratingOverall)}`)}
            ${row("Deposit return", `${params.ratingDeposit}/5`)}
            ${row("Maintenance", `${params.ratingMaintenance}/5`)}
            ${row("Responsiveness", `${params.ratingResponsiveness}/5`)}
            ${row("Listing accuracy", `${params.ratingAccuracy}/5`)}
            ${params.monthlyRent ? row("Rent paid", `HKD ${params.monthlyRent.toLocaleString()}/month`) : ""}
            ${row("Verified tenant", params.verifiedTenant ? "Yes" : "No")}
            ${row("Verification", params.verificationMethod)}
            ${params.reviewerEmail ? row("Reviewer email", params.reviewerEmail) : ""}
          </tbody>
        </table>

        <div style="background:#F9FAFB;border-left:3px solid #4D8B6F;border-radius:4px;padding:16px 20px;margin-bottom:28px;">
          <p style="color:#374151;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${params.reviewText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:48%;padding-right:8px;">
              <a href="${approveUrl}"
                 style="display:block;text-align:center;background:#4D8B6F;color:white;font-size:15px;font-weight:700;padding:16px;border-radius:10px;text-decoration:none;">
                ✓ APPROVE
              </a>
            </td>
            <td style="width:48%;padding-left:8px;">
              <a href="${rejectUrl}"
                 style="display:block;text-align:center;background:#E8573A;color:white;font-size:15px;font-weight:700;padding:16px;border-radius:10px;text-decoration:none;">
                ✕ REJECT
              </a>
            </td>
          </tr>
        </table>

        <hr style="border:none;border-top:1px solid #E2D9CE;margin:28px 0 16px;">
        <p style="color:#9CA3AF;font-size:11px;margin:0;">
          RentRadar &middot; rentradar.co &middot; Review ID: ${params.reviewId}
        </p>
      </div>
    </body>
    </html>
  `;

  const { error } = await resend.emails.send({
    from: "RentRadar <noreply@rentradar.co>",
    to: "joe@rentradar.co",
    subject: `New review to moderate — ${params.propertyName}`,
    html,
  });

  if (error) {
    console.error("Moderation email error:", JSON.stringify(error));
    throw new Error(JSON.stringify(error));
  }

  console.log("Moderation email sent for review:", params.reviewId);
}
