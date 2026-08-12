import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";
import { exchangeCodeForToken } from "@/lib/instagram";
import { consumeOAuthState, setSessionCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const appUrl = getAppUrl();

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/?instagram=denied&reason=${encodeURIComponent(error)}#integrations`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?instagram=missing_code#integrations`);
  }

  const stateValid = await consumeOAuthState(state);
  if (!stateValid) {
    return NextResponse.redirect(`${appUrl}/?instagram=invalid_state#integrations`);
  }

  try {
    const { accessToken, profile } = await exchangeCodeForToken(code);

    await setSessionCookie({
      userId: profile.user_id,
      username: profile.username,
      name: profile.name,
      profilePicture: profile.profile_picture_url,
      accessToken,
      connectedAt: new Date().toISOString(),
    });

    return NextResponse.redirect(`${appUrl}/?instagram=connected#integrations`);
  } catch (callbackError) {
    const message =
      callbackError instanceof Error
        ? callbackError.message
        : "Instagram connection failed";

    return NextResponse.redirect(
      `${appUrl}/?instagram=error&reason=${encodeURIComponent(message)}#integrations`,
    );
  }
}
