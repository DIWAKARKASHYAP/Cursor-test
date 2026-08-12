import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAppUrl, getInstagramConfig } from "@/lib/env";
import { getInstagramAuthorizeUrl } from "@/lib/instagram";
import { setOAuthState } from "@/lib/session";

export async function GET() {
  const config = getInstagramConfig();

  if (!config.isConfigured) {
    return NextResponse.redirect(
      `${getAppUrl()}/?instagram=missing_config#integrations`,
    );
  }

  const state = randomBytes(24).toString("hex");
  await setOAuthState(state);

  const authorizeUrl = getInstagramAuthorizeUrl(state);
  return NextResponse.redirect(authorizeUrl);
}
