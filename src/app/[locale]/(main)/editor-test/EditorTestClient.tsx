"use client";

import { useRef, useState } from "react";
import NewEditor, { type NewEditorHandle } from "@/features/editor/NewEditor";

/**
 * Sample "backend" payloads. The real editor accepts EITHER markdown OR HTML
 * (auto-detected) and always emits HTML on change / getHTML() — this page uses
 * the exact same contract so the backend and codebase structure stay untouched.
 */
const SAMPLE_MARKDOWN = `# Translation Result

This is a **fully editable** document. You can make text *italic*, __bold__, or ~~struck through~~.

## Key points

- First bullet point
- Second bullet point
  - A nested item
- Third bullet point

1. Ordered item one
2. Ordered item two
3. Ordered item three

## Data table

| Field | Original | Translation |
| ----- | -------- | ----------- |
| Name  | სახელი    | Name        |
| Date  | თარიღი    | Date        |
| Total | ჯამი      | Total       |

> A blockquote for notes and remarks.

Regular paragraph text with a [link](https://example.com) inside it.
`;

const SAMPLE_HTML = `<h1>Translation Result</h1>
<p>This document was delivered as <strong>HTML</strong> from the backend. Everything below is editable.</p>
<h2 style="text-align:center">Centered heading</h2>
<p><span style="font-family:Georgia, serif">Georgia font</span>, <span style="font-size:20px">20px text</span>, and <span style="color:#c0392b">colored text</span>.</p>
<table>
  <tbody>
    <tr><th>Field</th><th>Original</th><th>Translation</th></tr>
    <tr><td>Name</td><td>სახელი</td><td>Name</td></tr>
    <tr><td>Date</td><td>თარიღი</td><td>Date</td></tr>
  </tbody>
</table>
<ul><li>Bullet one</li><li>Bullet two</li></ul>`;

export default function EditorTestClient() {
  const editorRef = useRef<NewEditorHandle>(null);
  const [inputFormat, setInputFormat] = useState<"markdown" | "html">("markdown");
  const [source, setSource] = useState<string>(SAMPLE_MARKDOWN);
  const [output, setOutput] = useState<string>("");

  const loadSample = (fmt: "markdown" | "html") => {
    setInputFormat(fmt);
    setSource(fmt === "markdown" ? SAMPLE_MARKDOWN : SAMPLE_HTML);
    setOutput("");
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-suliko-default-color">Editor test — Word-like formatter</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Same input/output contract as the production editor: it accepts markdown <em>or</em> HTML and always
          returns HTML via <code>onChange</code> / <code>getHTML()</code>. Nothing on the backend changes.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => loadSample("markdown")}
          className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
            inputFormat === "markdown"
              ? "bg-suliko-default-color text-white border-transparent"
              : "bg-background hover:bg-muted"
          }`}
        >
          Load markdown sample
        </button>
        <button
          type="button"
          onClick={() => loadSample("html")}
          className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
            inputFormat === "html"
              ? "bg-suliko-default-color text-white border-transparent"
              : "bg-background hover:bg-muted"
          }`}
        >
          Load HTML sample
        </button>
        <button
          type="button"
          onClick={() => setOutput(editorRef.current?.getHTML() ?? "")}
          className="text-sm px-3 py-1.5 rounded-md border bg-background hover:bg-muted transition-colors ml-auto"
        >
          Read getHTML() output
        </button>
      </div>

      {/* Editor */}
      <div className="border border-border rounded-lg overflow-hidden mb-6">
        <div className="max-h-[75vh] overflow-y-auto bg-white">
          <NewEditor
            ref={editorRef}
            translatedMarkdown={source}
            onChange={(html) => setOutput(html)}
          />
        </div>
      </div>

      {/* Live output — proves the output format matches the backend contract */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-semibold mb-1">Backend input ({inputFormat})</div>
          <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-auto max-h-[300px] whitespace-pre-wrap break-words">
            {source}
          </pre>
        </div>
        <div>
          <div className="text-sm font-semibold mb-1">Live HTML output (onChange / getHTML)</div>
          <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-auto max-h-[300px] whitespace-pre-wrap break-words">
            {output || "— edit the document above to see the emitted HTML —"}
          </pre>
        </div>
      </div>
    </div>
  );
}
