import { Resend } from "resend";

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
