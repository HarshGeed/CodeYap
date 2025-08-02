import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("github_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated with GitHub" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const ref = searchParams.get("ref");

  if (!owner || !repo || !path) {
    return NextResponse.json({ error: "Missing owner, repo, or path" }, { status: 400 });
  }

  // Fetch file content from GitHub API
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3.raw",
    },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch file content" }, { status: 500 });
  }
  const content = await res.text();
  return new NextResponse(content, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}