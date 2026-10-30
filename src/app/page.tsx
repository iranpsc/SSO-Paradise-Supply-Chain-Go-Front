"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/session-provider";

export default function Page() {
  const { user, loading, error, refresh } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading || error) return;
    router.replace(user ? "/home" : "/login");
  }, [error, loading, router, user]);

  if (error) {
    return (
      <div role="alert" className="panel space-y-5">
        <p>{error}</p>
        <button className="primary" onClick={() => void refresh()}>
          تلاش دوباره
        </button>
      </div>
    );
  }

  return (
    <div role="status" className="panel animate-pulse">
      در حال بررسی نشست کاربری…
    </div>
  );
}
