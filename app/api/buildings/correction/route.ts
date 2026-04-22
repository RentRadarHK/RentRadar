import { NextRequest, NextResponse } from "next/server";
import { sendBuildingCorrectionEmail } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  let body: { buildingId?: string; buildingName?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const buildingId = body.buildingId?.trim();
  const buildingName = body.buildingName?.trim();
  const message = body.message?.trim();

  if (!buildingId || !buildingName || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (message.length < 10) {
    return NextResponse.json({ error: "Correction message is too short" }, { status: 400 });
  }

  try {
    await sendBuildingCorrectionEmail({ buildingId, buildingName, message });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send correction" }, { status: 500 });
  }
}
