import React, { useState, useEffect, useRef } from "react";
import MonacoEditor, { OnMount } from "@monaco-editor/react";
import { editor as MonacoEditorType } from "monaco-editor";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

// Syntax highlighting only
export function CodeHighlighter({ code, language }: { code: string; language: string }) {
  return (
    <SyntaxHighlighter language={language} style={oneDark} wrapLongLines>
      {code}
    </SyntaxHighlighter>
  );
}

// Code editor (Monaco)
export function CodeEditor({
  code,
  language,
  onChange,
  height = "260px",
  readOnly = false,
  ...props
}: {
  code: string;
  language: string;
  onChange?: (val: string) => void;
  height?: string;
  readOnly?: boolean;
  className?: string;
}) {
  const [internalValue, setInternalValue] = useState(code);
  const isFirst = useRef(true);
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);

  // Sync with parent if code prop changes (except on first mount)
  useEffect(() => {
    if (!isFirst.current) {
      setInternalValue(code);
    } else {
      isFirst.current = false;
    }
  }, [code]);

  // Attach blur event to Monaco editor instance
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidBlurEditorWidget(() => {
      if (onChange) onChange(editor.getValue());
    });
  };

  return (
    <MonacoEditor
      height={height}
      language={language}
      value={internalValue}
      theme="vs-dark"
      onChange={(val) => setInternalValue(val || "")}
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        fontSize: 15,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        lineNumbers: "on",
        scrollbar: { vertical: "hidden", horizontal: "hidden" },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        renderLineHighlight: "none",
        folding: false,
        contextmenu: false,
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        tabSize: 2,
        padding: { top: 8, bottom: 8 },
        theme: "vs-dark",
        readOnly,
      }}
      {...props}
    />
  );
}

export default { CodeHighlighter, CodeEditor }; 