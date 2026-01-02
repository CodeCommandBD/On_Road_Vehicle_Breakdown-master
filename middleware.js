import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "./lib/utils/constants";
import { getToken } from "next-auth/jwt";

// JWT Secret
// JWT Secret - Enforce environment variable in production
const SECRET_KEY = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!SECRET_KEY && process.env.NODE_ENV === "production") {
  throw new Error(
    "❌ JWT_SECRET or NEXTAUTH_SECRET must be defined in .env file"
  );
}

const JWT_SECRET = new TextEncoder().encode(
  SECRET_KEY || "dev-secret-key-change-in-prod" // Only for local dev fallback
);

// Create next-intl middleware
const intlMiddleware = createMiddleware(routing);

/**
 * Check if route is public (no authentication needed)
 */
function isPublicRoute(pathname) {
  // Remove locale prefix for checking
  const pathWithoutLocale = pathname.replace(/^\/(en|bn)/, "");

  // Allow cron jobs (Auth handled in route)
  if (pathWithoutLocale.startsWith("/api/cron")) {
    return true;
  }

  return PUBLIC_ROUTES.some((route) => {
    if (route === "/")
      return pathWithoutLocale === "" || pathWithoutLocale === "/";
    return pathWithoutLocale.startsWith(route);
  });
}

/**
 * Check if route requires specific role
 */
function getRequiredRole(pathname) {
  const pathWithoutLocale = pathname.replace(/^\/(en|bn)/, "");

  if (
    PROTECTED_ROUTES.ADMIN.some((route) => pathWithoutLocale.startsWith(route))
  ) {
    return "admin";
  }
  if (
    PROTECTED_ROUTES.GARAGE.some((route) => pathWithoutLocale.startsWith(route))
  ) {
    return "garage";
  }
  if (
    PROTECTED_ROUTES.USER.some((route) => pathWithoutLocale.startsWith(route))
  ) {
    return "user";
  }

  return null;
}

/**
 * Verify JWT token
 */
async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Main middleware function
 */
export default async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Debug log for authentication flow
  // console.log(`[Middleware] Processing: ${pathname}`);

  // Skip middleware for static files, API routes (except protected ones), and Next.js internals
  if (
    pathname.includes("/_next") ||
    pathname.includes("/api/_") ||
    pathname.includes("/_vercel") ||
    pathname.includes("/manifest.json") ||
    pathname.includes("/sw.js") ||
    pathname.includes("/workbox") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Apply internationalization middleware first
  const intlResponse = intlMiddleware(request);

  // If it's a redirect (e.g. /book -> /en/book), return it immediately
  if (
    intlResponse.status &&
    intlResponse.status >= 300 &&
    intlResponse.status < 400
  ) {
    return intlResponse;
  }

  // If it's a public route, just return the intl response
  if (isPublicRoute(pathname)) {
    return intlResponse;
  }

  // For protected routes, check authentication
  // console.log(`[Middleware] Protected route: ${pathname}`);
  // console.log(`[Middleware] Cookies keys:`, request.cookies.getAll().map(c => c.name));

  // 1. Try to get NextAuth session token (Standard way)
  // We let next-auth detect secure cookie mode automatically based on protocol/env
  const nextAuthToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 2. Check for custom JWT token (Credentials login legacy/custom flow)
  const customToken = request.cookies.get("token")?.value;

  // Decide if authenticated
  let isAuthenticated = false;
  let userRole = null;
  let userId = null;
  let userEmail = null;

  if (nextAuthToken) {
    isAuthenticated = true;
    userRole = nextAuthToken.role;
    userId = nextAuthToken.id || nextAuthToken.sub;
    userEmail = nextAuthToken.email;
  } else if (customToken) {
    const user = await verifyToken(customToken);
    if (user) {
      isAuthenticated = true;
      userRole = user.role;
      userId = user.userId;
      userEmail = user.email;
    }
  }

  if (!isAuthenticated) {
    // No valid token - redirect to login for web pages, return 401 for API
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Redirect to login page
    const locale = pathname.match(/^\/(en|bn)/)?.[1] || "en";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const requiredRole = getRequiredRole(pathname);

  if (requiredRole && userRole !== requiredRole && userRole !== "admin") {
    // User doesn't have required role
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to perform this action",
        },
        { status: 403 }
      );
    }

    // Redirect to appropriate dashboard based on user's role
    // Extract locale from pathname
    const locale = pathname.match(/^\/(en|bn)/)?.[1] || "en";
    const dashboardUrl = new URL(
      `/${locale}/${userRole}/dashboard`,
      request.url
    );
    return NextResponse.redirect(dashboardUrl);
  }

  // Add user info to request headers for use in API routes
  const requestHeaders = new Headers(request.headers);
  if (userId) requestHeaders.set("x-user-id", userId);
  if (userRole) requestHeaders.set("x-user-role", userRole);
  if (userEmail) requestHeaders.set("x-user-email", userEmail);

  // Return response with updated headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Match only internationalized pathnames and protected routes
  matcher: [
    "/((?!api|_next|_vercel|manifest.json|sw.js|workbox-.*.js|.*\\..*).*)",
  ],
};
