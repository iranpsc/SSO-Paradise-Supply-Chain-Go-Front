import { NextResponse, type NextRequest } from "next/server";

const actions: Record<string, string[]> = {
  "/login": ["POST"], "/logout": ["POST"], "/register": ["POST"],
  "/account": ["PUT", "PATCH", "POST"], "/personal-info": ["PUT", "PATCH", "POST"],
  "/change-password": ["PUT", "POST"], "/password/email": ["POST"],
  "/password/reset": ["POST"], "/password/confirm": ["POST"],
  "/email/verification-notification": ["POST"],
};

export function proxy(request: NextRequest) {
  if (actions[request.nextUrl.pathname]?.includes(request.method)) {
    const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, process.env.API_ORIGIN ?? "http://127.0.0.1:8080");
    return NextResponse.rewrite(destination);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/login", "/logout", "/register", "/account", "/personal-info", "/change-password", "/password/email", "/password/reset", "/password/confirm", "/email/verification-notification"] };
