import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  console.log("=== GitHub OAuth Callback Route Hit ===");
  console.log("Request URL:", req.url);
  console.log("Request method:", req.method);
  
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  
  // Construct base URL for redirects
  const baseUrl = `${url.protocol}//${url.host}`;
  
  console.log("GitHub OAuth Callback:", {
    code: code ? `${code.substring(0, 10)}...` : null,
    state,
    fullUrl: req.url
  });
  
  if (!code) {
    console.log("No code provided in callback");
    return NextResponse.redirect(`${baseUrl}/?github=error&message=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
      }),
    });
    const tokenData = await tokenRes.json();

    console.log("GitHub Token Response:", {
      success: !!tokenData.access_token,
      error: tokenData.error,
      errorDescription: tokenData.error_description
    });

    if (!tokenData.access_token) {
      console.log("Failed to get access token:", tokenData);
      return NextResponse.redirect(`${baseUrl}/?github=error&message=token_failed`);
    }

    // Set the token in a secure cookie
    // Redirect to home page with success parameter - the frontend will handle the return URL
    const response = NextResponse.redirect(`${baseUrl}/?github=success`);
    response.cookies.set("github_token", tokenData.access_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only secure in production
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return response;
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/?github=error&message=server_error`);
  }
}