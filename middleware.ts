import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // Import NextAuth authentication function

export async function middleware(req: NextRequest) {
  const session = await auth();
  // console.log("This is coming from middleware", session);

  // If user is not authenticated, redirect to sign-in page
  if (!session) {
    return NextResponse.redirect(new URL("/api/auth/signin", req.url)); // Redirect to actual auth page
  }

  return NextResponse.next(); // Allow access if authenticated
}

export const config = {
  matcher: [
    // Protect all routes except for API, static, and auth routes
    "/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)",
  ],
};