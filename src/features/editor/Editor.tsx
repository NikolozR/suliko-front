"use client";

import { useEffect, useRef } from "react";
import { marked } from "marked";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";

import "./editor.css";
import Toolbar from "./Toolbar";

interface EditorProps {
  translatedMarkdown: string;
  onChange?: (html: string) => void;
  hoveredText?: string | null;
}

export default function Editor({ translatedMarkdown, onChange, hoveredText }: EditorProps) {
  const isSettingDataRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
      Link.configure({ openOnClick: false, defaultProtocol: "https" }),
      Placeholder.configure({ placeholder: "Type or paste your content here!" }),
      Subscript,
      Superscript,
    ],
    immediatelyRender: false,
    content: translatedMarkdown || "",
    onUpdate({ editor }) {
      if (!isSettingDataRef.current) {
        onChange?.(editor.getHTML());
      }
    },
    editorProps: {
      attributes: { class: "tiptap-editor" },
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (!editor) return;
    const incoming = translatedMarkdown || "";
    const current = editor.getHTML();
    // Convert markdown → HTML when the content doesn't look like HTML already
    const isHtml = incoming.trimStart().startsWith("<");
    const html = isHtml ? incoming : marked(incoming, { async: false }) as string;
    if (current !== html) {
      isSettingDataRef.current = true;
      editor.commands.setContent(html);
      isSettingDataRef.current = false;
    }
  }, [editor, translatedMarkdown]);

  // Highlight hovered text via native selection
  useEffect(() => {
    const editorEl = containerRef.current?.querySelector(".tiptap-editor");
    if (!editorEl) return;

    const selection = window.getSelection();

    if (!hoveredText?.trim()) {
      selection?.removeAllRanges();
      return;
    }

    const search = hoveredText.trim();
    const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
      const text = node.textContent || "";
      const index = text.indexOf(search);
      if (index !== -1) {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + search.length);
        selection?.removeAllRanges();
        selection?.addRange(range);

        const rect = range.getBoundingClientRect();
        const container = (editorEl as HTMLElement).closest(".overflow-y-auto") || editorEl;
        const containerEl = container as HTMLElement;
        const containerRect = containerEl.getBoundingClientRect();
        if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
          containerEl.scrollTop += rect.top - containerRect.top - containerRect.height / 4;
        }
        break;
      }
      node = walker.nextNode();
    }
  }, [hoveredText]);

  return (
    <div className="main-container" ref={containerRef}>
      <Toolbar editor={editor} />
      <div className="editor-container editor-container_document-editor">
        <div className="editor-container__editor">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
