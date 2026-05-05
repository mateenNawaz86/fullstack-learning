import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login", "/register"];

// Routes that authenticated users shouldn't access (redirect to dashboard)
const authRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get authentication tokens from cookies
  const accessToken = request.cookies.get("accessToken");
  const refreshToken = request.cookies.get("refreshToken");

  // Check if user has valid tokens
  const isAuthenticated = !!(accessToken || refreshToken);

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Check if the current route is an auth route (login/register)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If user is authenticated and trying to access auth routes, redirect to /users
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/users", request.url));
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow the request to proceed

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by API route handlers)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
