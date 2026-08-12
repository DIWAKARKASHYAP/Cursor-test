import { NextResponse } from "next/server";
import { getInstagramConfig } from "@/lib/env";
import { publicSession, readSession } from "@/lib/session";

export async function GET() {
  const session = await readSession();
  const config = getInstagramConfig();

  return NextResponse.json({
    configured: config.isConfigured,
    connected: Boolean(session),
    user: publicSession(session),
  });
}
