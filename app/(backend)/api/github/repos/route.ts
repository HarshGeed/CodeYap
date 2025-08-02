import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("github_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated with GitHub" }, { status: 401 });
  }

  let repos: any[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const res = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 });
    }
    const data = await res.json();
    repos = repos.concat(data);
    hasNext = data.length === 100;
    page++;
  }

  return NextResponse.json(repos);
}