import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "ADMIN";
  const isOperator = session?.user?.role === "OPERATOR";
  const mustChangePassword = session?.user?.mustChangePassword;

  const isAuthRoute = nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/forgot-password");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isOperatorRoute = nextUrl.pathname.startsWith("/operator");
  const isChangePassword = nextUrl.pathname === "/change-password";
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

  if (isApiAuth) return NextResponse.next();

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isAuthRoute) {
    if (isAdmin) return NextResponse.redirect(new URL("/admin", nextUrl));
    return NextResponse.redirect(new URL("/operator", nextUrl));
  }

  if (isLoggedIn && mustChangePassword && !isChangePassword && !isAuthRoute) {
    return NextResponse.redirect(new URL("/change-password", nextUrl));
  }

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/operator", nextUrl));
  }

  if (isOperatorRoute && !isOperator && !isAdmin) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
