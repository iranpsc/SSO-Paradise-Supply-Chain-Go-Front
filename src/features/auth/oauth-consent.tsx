"use client";

import { useEffect, useState } from "react";
import { RequireSession } from "@/components/auth/require-session";
import { api, message } from "@/lib/api";

type Consent = {
  client: { name: string; redirect_uris: string[] };
  scopes: string[];
  auth_token: string;
};

export function OAuthConsent() {
  const [consent, setConsent] = useState<Consent>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api<Consent>("/oauth/consent")
      .then((result) => {
        if (active) setConsent(result);
      })
      .catch((err) => {
        if (active) setError(message(err));
      });
    return () => {
      active = false;
    };
  }, []);

  async function decide(approve: boolean) {
    if (!consent || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ redirect: string }>("/oauth/consent", {
        method: "POST",
        body: JSON.stringify({ auth_token: consent.auth_token, approve }),
      });
      const target = new URL(result.redirect);
      // Only follow the registered client callback returned by the backend.
      const registered = consent.client.redirect_uris.some((uri) => {
        const base = new URL(uri);
        return (
          base.origin === target.origin && base.pathname === target.pathname
        );
      });
      if (
        !registered ||
        target.username ||
        target.password ||
        !["https:", "http:"].includes(target.protocol)
      )
        throw new Error("آدرس بازگشت معتبر نیست.");
      window.location.assign(target.href);
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  return (
    <RequireSession verified={false}>
      <section className="panel mx-auto max-w-xl">
        <h1 className="text-2xl font-bold">تأیید دسترسی سامانه</h1>
        {consent ? (
          <>
            <p className="mt-5">
              سامانه «{consent.client.name}» درخواست اتصال به حساب شما را دارد.
            </p>
            {consent.scopes.length > 0 && (
              <p className="muted mt-3">
                دسترسی‌ها: {consent.scopes.join("، ")}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                className="primary"
                disabled={busy}
                onClick={() => void decide(true)}
              >
                تأیید دسترسی
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void decide(false)}
              >
                رد درخواست
              </button>
            </div>
          </>
        ) : (
          !error && (
            <p className="mt-5" role="status">
              در حال بارگذاری درخواست…
            </p>
          )
        )}
        {error && (
          <p className="mt-5 text-red-600" role="alert">
            {error}
          </p>
        )}
      </section>
    </RequireSession>
  );
}
