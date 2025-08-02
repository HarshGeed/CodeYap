// app/api/github/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const state = Math.random().toString(36).substring(2);

  const protocol = req.nextUrl.protocol || 'http:';  // Next.js App Router compatible
  const host = req.headers.get("host") || 'localhost:3000';
  const redirectUri = `${protocol}//${host}/api/github/oauth-callback`;

  if (!process.env.GITHUB_CLIENT_ID) {
    return NextResponse.json({ error: "Missing GitHub Client ID" }, { status: 500 });
  }

  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo&state=${state}`;

  return NextResponse.json({ url });
}
