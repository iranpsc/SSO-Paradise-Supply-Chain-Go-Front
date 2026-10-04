"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { persianMessage } from "@/lib/persian-messages";
import { oauthReturnTo } from "@/lib/navigation";

export function LegacyFlash() {
  const path = usePathname();
  const [messages, setMessages] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/legacy/flash", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() : {})
      .then((body: { errors?: Record<string, string[]>; message?: string; intended?: string }) => {
        if (!active) return;
        const intended = oauthReturnTo(body.intended ?? null);
        if (intended) sessionStorage.setItem("sso:return_to", intended);
        const errors = Object.values(body.errors ?? {}).flat();
        setFailed(errors.length > 0);
        setMessages((errors.length ? errors : body.message ? [body.message] : []).map((value) => persianMessage(value)));
      }).catch(() => {});
    return () => { active = false; };
  }, [path]);
  if (!messages.length) return null;
  return <div role="alert" className={`notice ${failed ? "error" : "success"}`}>{messages.map((message, index) => <p key={index}>{message}</p>)}</div>;
}
