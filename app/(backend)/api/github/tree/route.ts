import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("github_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated with GitHub" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  let branch = searchParams.get("branch");

  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
  }

  // Get default branch if not provided
  if (!branch) {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (!repoRes.ok) {
      return NextResponse.json({ error: "Failed to fetch repo info" }, { status: 500 });
    }
    const repoData = await repoRes.json();
    branch = repoData.default_branch;
  }

  // Get the tree SHA for the branch
  const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!branchRes.ok) {
    return NextResponse.json({ error: "Failed to fetch branch info" }, { status: 500 });
  }
  const branchData = await branchRes.json();
  const treeSha = branchData.commit.commit.tree.sha;

  // Fetch the tree recursively
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!treeRes.ok) {
    return NextResponse.json({ error: "Failed to fetch file tree" }, { status: 500 });
  }
  const treeData = await treeRes.json();

  return NextResponse.json(treeData);
}