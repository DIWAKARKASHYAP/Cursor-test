import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getInstagramConfig } from "@/lib/env";

export type InstagramSession = {
  userId: string;
  username: string;
  name?: string;
  profilePicture?: string;
  accessToken: string;
  connectedAt: string;
};

const SESSION_COOKIE = "tideway_instagram_session";
const STATE_COOKIE = "tideway_instagram_oauth_state";

function getSecret() {
  const { sessionSecret } = getInstagramConfig();
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return new TextEncoder().encode(sessionSecret);
}

export async function createSessionToken(
  session: InstagramSession,
): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60d")
    .sign(getSecret());
}

export async function readSession(): Promise<InstagramSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: String(payload.userId),
      username: String(payload.username),
      name: payload.name ? String(payload.name) : undefined,
      profilePicture: payload.profilePicture
        ? String(payload.profilePicture)
        : undefined,
      accessToken: String(payload.accessToken),
      connectedAt: String(payload.connectedAt),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: InstagramSession) {
  const cookieStore = await cookies();
  const token = await createSessionToken(session);

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function setOAuthState(state: string) {
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function consumeOAuthState(
  state: string | null,
): Promise<boolean> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  return Boolean(state && stored && state === stored);
}

export function publicSession(session: InstagramSession | null) {
  if (!session) {
    return null;
  }

  return {
    userId: session.userId,
    username: session.username,
    name: session.name,
    profilePicture: session.profilePicture,
    connectedAt: session.connectedAt,
    profileUrl: `https://www.instagram.com/${session.username}/`,
  };
}
