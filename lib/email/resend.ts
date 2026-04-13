import { Resend } from "resend";
import { VerificationEmail } from "@/emails/VerificationEmail";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY environment variable is not set");
  return new Resend(key);
}

export async function sendVerificationEmail(
  email: string,
  reviewId: string,
  token: string
): Promise<void> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/reviews/verify?token=${token}`;

  const { error } = await getResend().emails.send({
    from: "RentRadar <noreply@rentradar.co>",
    to: email,
    subject: "Verify your review — RentRadar",
    react: VerificationEmail({ verifyUrl, reviewId }),
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
