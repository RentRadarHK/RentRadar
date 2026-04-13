import { Resend } from "resend";
import { VerificationEmail } from "@/emails/VerificationEmail";

export async function sendVerificationEmail(
  email: string,
  reviewId: string,
  token: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/reviews/verify?token=${token}`;

  const { error } = await resend.emails.send({
    from: "RentRadar <noreply@rentradar.co>",
    to: email,
    subject: "Verify your RentRadar review",
    react: VerificationEmail({ verifyUrl, reviewId }),
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }
}
