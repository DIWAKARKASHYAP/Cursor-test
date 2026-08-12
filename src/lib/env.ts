function required(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getAppUrl(): string {
  const explicit = required("NEXT_PUBLIC_APP_URL");
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercelUrl = required("VERCEL_URL");
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function getInstagramConfig() {
  const clientId = required("INSTAGRAM_CLIENT_ID");
  const clientSecret = required("INSTAGRAM_CLIENT_SECRET");
  const redirectUri =
    required("INSTAGRAM_REDIRECT_URI") ??
    `${getAppUrl()}/api/auth/instagram/callback`;
  const sessionSecret = required("SESSION_SECRET");

  return {
    clientId,
    clientSecret,
    redirectUri,
    sessionSecret,
    isConfigured: Boolean(clientId && clientSecret && sessionSecret),
  };
}
