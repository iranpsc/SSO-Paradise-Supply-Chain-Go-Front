"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { oauthReturnTo } from "@/lib/navigation";
import { useSession } from "./session-provider";
export function RequireSession({
  children,
  verified = true,
}: {
  children: ReactNode;
  verified?: boolean;
}) {
  const { user, loading, error, refresh } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!loading && !error) {
      if (!user) router.replace("/login");
      else if (verified && !user.email_verified_at)
        router.replace("/email/verify");
      else if (
        user.email_verified_at &&
        (pathname === "/home" || pathname === "/email/verify")
      ) {
        // Signed verification links return via the backend to /home. Resume
        // the saved authorization request once the verified account is loaded.
        const intended = oauthReturnTo(sessionStorage.getItem("sso:return_to"));
        if (intended) {
          sessionStorage.removeItem("sso:return_to");
          window.location.assign(intended);
        }
      }
    }
  }, [loading, error, user, verified, router, pathname]);
  if (error)
    return (
      <div role="alert" className="panel space-y-5">
        <p>{error}</p>
        <button className="primary" onClick={() => void refresh()}>
          تلاش دوباره
        </button>
      </div>
    );
  if (loading || !user || (verified && !user.email_verified_at))
    return (
      <div role="status" className="panel animate-pulse">
        در حال دریافت اطلاعات حساب…
      </div>
    );
  return children;
}
