import { getInstagramConfig } from "@/lib/env";

const SCOPES = ["instagram_business_basic"];

type ShortLivedTokenResponse = {
  access_token: string;
  user_id: number;
};

type LongLivedTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type InstagramProfile = {
  user_id: string;
  username: string;
  name?: string;
  account_type?: string;
  profile_picture_url?: string;
};

export function getInstagramAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getInstagramConfig();
  if (!clientId || !redirectUri) {
    throw new Error("Instagram OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });

  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const { clientId, clientSecret, redirectUri } = getInstagramConfig();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Instagram OAuth is not configured");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Instagram token exchange failed: ${detail}`);
  }

  const shortLived = (await response.json()) as ShortLivedTokenResponse;
  const longLived = await exchangeForLongLivedToken(shortLived.access_token);
  const profile = await fetchInstagramProfile(longLived.access_token);

  return {
    accessToken: longLived.access_token,
    profile,
  };
}

async function exchangeForLongLivedToken(shortLivedToken: string) {
  const { clientSecret } = getInstagramConfig();
  if (!clientSecret) {
    throw new Error("Instagram OAuth is not configured");
  }

  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: clientSecret,
    access_token: shortLivedToken,
  });

  const response = await fetch(
    `https://graph.instagram.com/access_token?${params.toString()}`,
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Instagram long-lived token exchange failed: ${detail}`);
  }

  return (await response.json()) as LongLivedTokenResponse;
}

async function fetchInstagramProfile(accessToken: string) {
  const params = new URLSearchParams({
    fields: "user_id,username,name,account_type,profile_picture_url",
    access_token: accessToken,
  });

  const response = await fetch(
    `https://graph.instagram.com/v21.0/me?${params.toString()}`,
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Instagram profile fetch failed: ${detail}`);
  }

  return (await response.json()) as InstagramProfile;
}
