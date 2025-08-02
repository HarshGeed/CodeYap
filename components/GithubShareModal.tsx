import React, { useEffect, useState } from "react";

interface GithubShareModalProps {
  open: boolean;
  onClose: () => void;
  onShare: (payload: {
    repo: string;
    file: string;
    start: number;
    end: number;
    code: string;
    language: string;
  }) => void;
}

type GithubRepo = any;
type GithubTree = { path: string; type: string; url: string };

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case "js": return "javascript";
    case "ts": return "typescript";
    case "py": return "python";
    case "java": return "java";
    case "c": return "c";
    case "cpp": return "cpp";
    case "go": return "go";
    case "php": return "php";
    case "rb": return "ruby";
    case "rs": return "rust";
    case "kt": return "kotlin";
    case "swift": return "swift";
    case "cs": return "csharp";
    case "sh": return "shell";
    case "sql": return "sql";
    case "txt": return "plaintext";
    default: return "plaintext";
  }
}

const GithubShareModal: React.FC<GithubShareModalProps> = ({ open, onClose, onShare }) => {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [tree, setTree] = useState<GithubTree[] | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<GithubTree | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedLines, setSelectedLines] = useState<[number, number] | null>(null);

  // Debug modal open state
  useEffect(() => {
    console.log("GithubShareModal open state changed:", open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelectedRepo(null);
    setTree(null);
    setSelectedFile(null);
    setFileContent(null);
    setSelectedLines(null);
    setLoading(true);
    setError(null);
    fetch("/api/github/repos")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch repositories");
        return res.json();
      })
      .then((data) => setRepos(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open]);

  // Fetch file tree when repo is selected
  useEffect(() => {
    if (!selectedRepo) return;
    setTree(null);
    setTreeLoading(true);
    setTreeError(null);
    setSelectedFile(null);
    setFileContent(null);
    setSelectedLines(null);
    fetch(`/api/github/tree?owner=${encodeURIComponent(selectedRepo.owner.login)}&repo=${encodeURIComponent(selectedRepo.name)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch file tree");
        return res.json();
      })
      .then((data) => setTree(data.tree))
      .catch((err) => setTreeError(err.message))
      .finally(() => setTreeLoading(false));
  }, [selectedRepo]);

  // Fetch file content when file is selected
  useEffect(() => {
    if (!selectedFile || !selectedRepo) return;
    setFileContent(null);
    setFileLoading(true);
    setFileError(null);
    setSelectedLines(null);
    fetch(`/api/github/file?owner=${encodeURIComponent(selectedRepo.owner.login)}&repo=${encodeURIComponent(selectedRepo.name)}&path=${encodeURIComponent(selectedFile.path)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch file content");
        return res.text();
      })
      .then((data) => setFileContent(data))
      .catch((err) => setFileError(err.message))
      .finally(() => setFileLoading(false));
  }, [selectedFile, selectedRepo]);

  // Line selection logic
  const handleLineClick = (line: number, e: React.MouseEvent) => {
    if (e.shiftKey && selectedLines) {
      // Extend selection with Shift+click
      const start = Math.min(selectedLines[0], line);
      const end = Math.max(selectedLines[1], line);
      setSelectedLines([start, end]);
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle line with Ctrl/Cmd+click (for individual line selection)
      if (selectedLines && selectedLines[0] === line && selectedLines[1] === line) {
        setSelectedLines(null); // Deselect if clicking the same line
      } else {
        setSelectedLines([line, line]);
      }
    } else {
      // Normal click - start new selection
      setSelectedLines([line, line]);
    }
  };

  // Select all lines
  const handleSelectAll = () => {
    if (fileContent) {
      const totalLines = fileContent.split("\n").length;
      setSelectedLines([1, totalLines]);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedLines(null);
  };

  // Select first N lines
  const handleSelectFirst = (n: number) => {
    if (fileContent) {
      const totalLines = fileContent.split("\n").length;
      const endLine = Math.min(n, totalLines);
      setSelectedLines([1, endLine]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-[#181a20] rounded-xl shadow-lg p-6 w-full max-w-2xl relative border border-[#22304a] min-h-[400px] max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-[#60a5fa] hover:text-white text-xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-[#e0e7ef] mb-4">Share Code from GitHub</h2>
        {selectedFile ? (
          <>
            <button
              className="mb-3 text-[#60a5fa] hover:underline text-sm"
              onClick={() => {
                setSelectedFile(null);
                setFileContent(null);
                setSelectedLines(null);
              }}
            >
              ← Back to files
            </button>
            <div className="font-semibold text-[#60a5fa] mb-2">{selectedFile.path}</div>
            {fileLoading ? (
              <div className="text-[#60a5fa] text-center py-8">Loading file content...</div>
            ) : fileError ? (
              <div className="text-red-400 text-center py-8">{fileError}</div>
            ) : fileContent ? (
              <>
                {/* Selection controls */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <button
                    className="text-xs bg-[#22304a] hover:bg-[#2563eb]/30 text-[#60a5fa] px-2 py-1 rounded transition"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </button>
                  <button
                    className="text-xs bg-[#22304a] hover:bg-[#2563eb]/30 text-[#60a5fa] px-2 py-1 rounded transition"
                    onClick={() => handleSelectFirst(10)}
                  >
                    First 10 Lines
                  </button>
                  <button
                    className="text-xs bg-[#22304a] hover:bg-[#2563eb]/30 text-[#60a5fa] px-2 py-1 rounded transition"
                    onClick={() => handleSelectFirst(25)}
                  >
                    First 25 Lines
                  </button>
                  {selectedLines && (
                    <button
                      className="text-xs bg-[#22304a] hover:bg-[#2563eb]/30 text-[#60a5fa] px-2 py-1 rounded transition"
                      onClick={handleClearSelection}
                    >
                      Clear Selection
                    </button>
                  )}
                  {selectedLines && (
                    <span className="text-xs text-[#a0aec0]">
                      {selectedLines[0] === selectedLines[1] 
                        ? `Line ${selectedLines[0]} selected`
                        : `Lines ${selectedLines[0]}-${selectedLines[1]} selected (${selectedLines[1] - selectedLines[0] + 1} lines)`
                      }
                    </span>
                  )}
                </div>
                
                {/* File content with line numbers */}
                <div className="border border-[#22304a] rounded-lg bg-[#171b24] overflow-x-auto max-h-96 mb-4">
                  <div className="text-xs text-[#a0aec0] bg-[#22304a]/30 px-3 py-2 border-b border-[#22304a] flex items-center gap-2">
                    <span>💡</span>
                    <span><strong>How to select:</strong> Click any line → Shift+click to extend → Ctrl/Cmd+click to toggle individual lines</span>
                  </div>
                  <pre className="text-xs text-[#e0e7ef] font-mono p-2">
                    {fileContent.split("\n").map((line, idx) => {
                      const lineNum = idx + 1;
                      const isSelected = selectedLines && lineNum >= selectedLines[0] && lineNum <= selectedLines[1];
                      return (
                        <div
                          key={lineNum}
                          className={`flex cursor-pointer hover:bg-[#22304a]/50 ${
                            isSelected ? "bg-[#2563eb]/30" : ""
                          }`}
                          onClick={(e) => handleLineClick(lineNum, e)}
                        >
                          <span className={`w-12 text-right pr-2 select-none ${
                            isSelected ? "text-[#60a5fa] font-semibold" : "text-[#60a5fa]/70"
                          }`}>{lineNum}</span>
                          <span className="whitespace-pre flex-1">{line}</span>
                        </div>
                      );
                    })}
                  </pre>
                </div>
              </>
            ) : null}
            {fileContent && (
              <div className="flex items-center gap-3">
                <button
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-2 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedLines}
                  onClick={() => {
                    if (!selectedLines) return;
                    const [start, end] = selectedLines;
                    const lines = fileContent.split("\n").slice(start - 1, end).join("\n");
                    onShare({
                      repo: selectedRepo.full_name,
                      file: selectedFile.path,
                      start,
                      end,
                      code: lines,
                      language: getLanguageFromFilename(selectedFile.path),
                    });
                  }}
                >
                  {selectedLines
                    ? selectedLines[0] === selectedLines[1]
                      ? `Share Line ${selectedLines[0]}`
                      : `Share Lines ${selectedLines[0]}-${selectedLines[1]} (${selectedLines[1] - selectedLines[0] + 1} lines)`
                    : "Select lines to share"
                  }
                </button>
                {!selectedLines && (
                  <span className="text-xs text-[#a0aec0]">
                    Select one or more lines first
                  </span>
                )}
              </div>
            )}
          </>
        ) : selectedRepo ? (
          <>
            <button
              className="mb-3 text-[#60a5fa] hover:underline text-sm"
              onClick={() => {
                setSelectedRepo(null);
                setTree(null);
              }}
            >
              ← Back to repositories
            </button>
            <div className="font-semibold text-[#60a5fa] mb-2">{selectedRepo.full_name}</div>
            {treeLoading ? (
              <div className="text-[#60a5fa] text-center py-8">Loading file tree...</div>
            ) : treeError ? (
              <div className="text-red-400 text-center py-8">{treeError}</div>
            ) : tree ? (
              <ul className="max-h-72 overflow-y-auto divide-y divide-[#22304a]">
                {tree.filter(item => item.type === "blob").map((item) => (
                  <li
                    key={item.path}
                    className="py-2 px-2 hover:bg-[#22304a] cursor-pointer rounded transition flex flex-row items-center"
                    onClick={() => setSelectedFile(item)}
                  >
                    <span className="text-[#e0e7ef] font-mono text-sm">{item.path}</span>
                  </li>
                ))}
                {tree.filter(item => item.type === "blob").length === 0 && (
                  <li className="text-[#a0aec0] text-center py-8">No files found in this repo.</li>
                )}
              </ul>
            ) : null}
          </>
        ) : loading ? (
          <div className="text-[#60a5fa] text-center py-8">Loading repositories...</div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : (
          <ul className="max-h-80 overflow-y-auto divide-y divide-[#22304a]">
            {repos.map((repo) => (
              <li
                key={repo.id}
                className="py-3 px-2 hover:bg-[#22304a] cursor-pointer rounded transition flex flex-col"
                onClick={() => setSelectedRepo(repo)}
              >
                <span className="font-semibold text-[#60a5fa]">{repo.full_name}</span>
                <span className="text-xs text-[#a0aec0]">{repo.private ? "Private" : "Public"}</span>
              </li>
            ))}
            {repos.length === 0 && (
              <li className="text-[#a0aec0] text-center py-8">No repositories found.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GithubShareModal;