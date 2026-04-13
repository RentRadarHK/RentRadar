import { Resend } from "resend";
import { VerificationEmail } from "@/emails/VerificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  reviewId: string,
  token: string
): Promise<void> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/reviews/verify?token=${token}`;

  const { error } = await resend.emails.send({
    from: "RentRadar <noreply@rentradar.co>",
    to: email,
    subject: "Verify your RentRadar review",
    react: VerificationEmail({ verifyUrl, reviewId }),
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
