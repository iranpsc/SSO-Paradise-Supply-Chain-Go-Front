"use client";
import Link from "next/link";
import { verificationTarget } from "@/lib/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireSession } from "@/components/auth/require-session";
import { useSession } from "@/components/auth/session-provider";
import { api, message } from "@/lib/api";
export function VerifyEmail() {
  const { user, refresh } = useSession();
  const params = useSearchParams();
  const [remaining, setRemaining] = useState(60);
  useEffect(() => {
    // Keep the resend cooldown across reloads without sending mail on mount.
    const stored = Number(localStorage.getItem("verify_timer_end"));
    const end =
      Number.isFinite(stored) && stored > 0 ? stored : Date.now() + 60_000;
    localStorage.setItem("verify_timer_end", String(end));
    const update = () =>
      setRemaining(
        Math.max(
          0,
          Math.ceil(
            (Number(localStorage.getItem("verify_timer_end")) - Date.now()) /
              1000,
          ),
        ),
      );
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function send(verify: boolean) {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ message: string; redirect?: string }>(
        verify ? "/email/verify" : "/email/verification-notification",
        {
          method: "POST",
          body: JSON.stringify(verify ? { token: params.get("token") } : {}),
        },
      );
      setNotice(result.message);
      if (!verify) {
        const end = Date.now() + 60_000;
        localStorage.setItem("verify_timer_end", String(end));
        setRemaining(60);
      }
      if (verify) {
        await refresh();
        window.location.assign(verificationTarget(result.redirect));
      }
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <RequireSession verified={false}>
      <section className="panel mx-auto max-w-xl text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl text-blue-600 dark:bg-blue-950"
          aria-hidden
        >
          ✉
        </div>
        <h1 className="text-2xl font-bold">ایمیل خود را تأیید کنید</h1>
        <p className="muted mt-4">
          برای ادامه، پیوند تأیید ارسال‌شده به ایمیل زیر را باز کنید.
        </p>
        <p className="my-5 break-all font-bold" dir="ltr">
          {user?.email}
        </p>
        {user?.email_verified_at ? (
          <Link className="primary" href="/home">
            ورود به پیشخوان
          </Link>
        ) : (
          <div className="flex flex-col gap-3">
            {params.get("token") && (
              <button
                className="primary"
                disabled={busy}
                onClick={() => void send(true)}
              >
                تأیید ایمیل و ادامه
              </button>
            )}
            <button
              className="secondary"
              disabled={busy || remaining > 0}
              onClick={() => void send(false)}
            >
              {remaining > 0
                ? `ارسال مجدد تا ${remaining} ثانیه دیگر`
                : "ارسال دوبارهٔ پیوند تأیید"}
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-5 text-sm text-red-600">
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-5 text-sm text-green-700 dark:text-green-400"
          >
            {notice}
          </p>
        )}
      </section>
    </RequireSession>
  );
}
