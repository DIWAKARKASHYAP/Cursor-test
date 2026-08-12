"use client";

import { useEffect, useState } from "react";

type InstagramUser = {
  userId: string;
  username: string;
  name?: string;
  profilePicture?: string;
  connectedAt: string;
  profileUrl: string;
};

type InstagramStatus = {
  configured: boolean;
  connected: boolean;
  user: InstagramUser | null;
};

const statusMessages: Record<string, string> = {
  connected: "Instagram account connected successfully.",
  denied: "Instagram login was cancelled.",
  missing_code: "Instagram did not return an authorization code.",
  invalid_state: "Login session expired. Please try connecting again.",
  missing_config:
    "Instagram OAuth is not configured yet. Add app credentials in Vercel.",
  error: "Could not connect Instagram. Check your Meta app settings.",
};

function getBannerMessage(search: string) {
  const params = new URLSearchParams(search);
  const status = params.get("instagram");
  if (!status) {
    return null;
  }

  if (status === "error" || status === "denied") {
    const reason = params.get("reason");
    return reason ?? statusMessages[status] ?? statusMessages.error;
  }

  return statusMessages[status] ?? null;
}

export function InstagramConnect() {
  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [banner, setBanner] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : getBannerMessage(window.location.search),
  );

  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch("/api/auth/instagram/me");
        const data = (await response.json()) as InstagramStatus;
        setStatus(data);
      } finally {
        setLoading(false);
      }
    }

    void loadStatus();
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/instagram/disconnect", { method: "POST" });
      setStatus((current) =>
        current
          ? { ...current, connected: false, user: null }
          : { configured: false, connected: false, user: null },
      );
      setBanner("Instagram account disconnected.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <section
      id="integrations"
      className="rounded-2xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(12,31,46,0.04)]"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-tide">Integrations</p>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight text-ink">
            Connect Instagram
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Sign in with Instagram from this portal to link a professional
            account. After connecting, open Instagram directly from your
            dashboard.
          </p>
        </div>

        <div className="flex min-w-[280px] flex-col gap-3">
          {loading ? (
            <p className="text-sm text-ink-soft">Checking connection…</p>
          ) : status?.connected && status.user ? (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-mist bg-foam p-4">
                {status.user.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={status.user.profilePicture}
                    alt={status.user.username}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)] text-sm font-bold text-white">
                    IG
                  </div>
                )}
                <div>
                  <p className="font-semibold text-ink">
                    @{status.user.username}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {status.user.name ?? "Instagram professional account"}
                  </p>
                </div>
              </div>

              <a
                href={status.user.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Open Instagram
              </a>

              <button
                type="button"
                onClick={() => void handleDisconnect()}
                disabled={disconnecting}
                className="rounded-xl border border-mist px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-foam disabled:opacity-60"
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </>
          ) : (
            <>
              <a
                href="/api/auth/instagram"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Continue with Instagram
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-mist px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-foam"
              >
                Go to instagram.com
              </a>
            </>
          )}
        </div>
      </div>

      {banner ? (
        <p className="mt-5 rounded-xl border border-mist bg-foam px-4 py-3 text-sm text-ink-soft">
          {banner}
        </p>
      ) : null}

      {!loading && status && !status.configured ? (
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, and
          `SESSION_SECRET` in Vercel, then set your Meta redirect URI to{" "}
          <code className="font-mono text-xs">
            /api/auth/instagram/callback
          </code>
          .
        </p>
      ) : null}
    </section>
  );
}
