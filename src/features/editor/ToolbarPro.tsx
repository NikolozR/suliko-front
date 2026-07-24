"use client";

import { useEffect, useRef, useState } from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  RemoveFormatting,
  Minus,
  Subscript,
  Superscript,
  Quote,
  IndentDecrease,
  IndentIncrease,
  Baseline,
  Highlighter,
  ChevronDown,
  Rows,
  Columns,
  Trash2,
  Grid2x2,
  Merge,
  Split,
} from "lucide-react";

interface ToolbarProps {
  editor: Editor | null;
}

/* ── Font + size options (Word-like) ─────────────────────────── */

const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
  { label: "Sylfaen (ქართული)", value: "Sylfaen, serif" },
];

const FONT_SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72"];

const LINE_HEIGHTS: { label: string; value: string }[] = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "2.0", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3.0", value: "3" },
];

/* ── Small building blocks ───────────────────────────────────── */

function ToolbarButton({
  onClick,
  active,
  title,
  disabled,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      title={title}
      disabled={disabled}
      className={`toolbar-btn${active ? " toolbar-btn--active" : ""}${disabled ? " toolbar-btn--disabled" : ""}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="toolbar-divider" />;
}

/** A click-to-open dropdown that closes on outside click / Escape. */
function ToolbarDropdown({
  title,
  icon,
  label,
  children,
  disabled,
}: {
  title: string;
  icon: React.ReactNode;
  label?: string;
  children: (close: () => void) => React.ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="toolbar-dropdown" ref={rootRef}>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          if (!disabled) setOpen((v) => !v);
        }}
        title={title}
        disabled={disabled}
        className={`toolbar-btn toolbar-btn--dropdown${open ? " toolbar-btn--active" : ""}${disabled ? " toolbar-btn--disabled" : ""}`}
      >
        {icon}
        {label && <span className="toolbar-btn__label">{label}</span>}
        <ChevronDown size={12} />
      </button>
      {open && <div className="toolbar-menu">{children(() => setOpen(false))}</div>}
    </div>
  );
}

function MenuItem({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="toolbar-menu__item"
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
    >
      {children}
    </button>
  );
}

/* ── The toolbar ─────────────────────────────────────────────── */

export default function ToolbarPro({ editor }: ToolbarProps) {
  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const insertImage = () => {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  // Current block type for the "Paragraph/Heading" select
  const currentBlock = (() => {
    for (let level = 1 as 1 | 2 | 3 | 4 | 5 | 6; level <= 6; level++) {
      if (editor.isActive("heading", { level })) return `h${level}`;
    }
    return "paragraph";
  })();

  const applyBlock = (value: string) => {
    const chain = editor.chain().focus();
    if (value === "paragraph") chain.setParagraph().run();
    else chain.setHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
  };

  const currentFontFamily = (editor.getAttributes("textStyle").fontFamily as string) || "";
  const currentFontSize = ((editor.getAttributes("textStyle").fontSize as string) || "").replace("px", "");

  const inTable = editor.isActive("table");

  return (
    <div className="tiptap-toolbar tiptap-toolbar--pro">
      {/* Undo / Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)" disabled={!editor.can().undo()}>
        <Undo size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)" disabled={!editor.can().redo()}>
        <Redo size={15} />
      </ToolbarButton>

      <Divider />

      {/* Block type: Paragraph / Headings */}
      <select
        className="toolbar-select toolbar-select--block"
        title="Paragraph style"
        value={currentBlock}
        onChange={(e) => applyBlock(e.target.value)}
      >
        <option value="paragraph">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
      </select>

      {/* Font family */}
      <select
        className="toolbar-select toolbar-select--font"
        title="Font"
        value={currentFontFamily}
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontFamily(v).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.label} value={f.value} style={f.value ? { fontFamily: f.value } : undefined}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Font size */}
      <select
        className="toolbar-select toolbar-select--size"
        title="Font size"
        value={currentFontSize}
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontSize(`${v}px`).run();
          else editor.chain().focus().unsetFontSize().run();
        }}
      >
        <option value="">--</option>
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <Divider />

      {/* Inline marks */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
        <Underline size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
        <Code size={15} />
      </ToolbarButton>

      {/* Text color */}
      <label className="toolbar-color" title="Text color">
        <Baseline size={15} />
        <span
          className="toolbar-color__swatch"
          style={{ background: (editor.getAttributes("textStyle").color as string) || "#111111" }}
        />
        <input
          type="color"
          value={(editor.getAttributes("textStyle").color as string) || "#111111"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>

      {/* Highlight color */}
      <label className="toolbar-color" title="Highlight color">
        <Highlighter size={15} />
        <span
          className="toolbar-color__swatch"
          style={{ background: (editor.getAttributes("highlight").color as string) || "#ffff00" }}
        />
        <input
          type="color"
          value={(editor.getAttributes("highlight").color as string) || "#ffff00"}
          onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
        />
      </label>

      <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript">
        <Subscript size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript">
        <Superscript size={15} />
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
        <AlignLeft size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
        <AlignCenter size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
        <AlignRight size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
        <AlignJustify size={15} />
      </ToolbarButton>

      {/* Line height */}
      <ToolbarDropdown title="Line spacing" icon={<span className="toolbar-btn__icon-text">↕</span>} label="Spacing">
        {(close) => (
          <>
            {LINE_HEIGHTS.map((lh) => (
              <MenuItem
                key={lh.value}
                onClick={() => {
                  editor.chain().focus().setLineHeight(lh.value).run();
                  close();
                }}
              >
                {lh.label}
              </MenuItem>
            ))}
            <MenuItem
              onClick={() => {
                editor.chain().focus().unsetLineHeight().run();
                close();
              }}
            >
              Reset
            </MenuItem>
          </>
        )}
      </ToolbarDropdown>

      <Divider />

      {/* Lists + indentation */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        title="Decrease indent"
        disabled={!editor.can().liftListItem("listItem")}
      >
        <IndentDecrease size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        title="Increase indent"
        disabled={!editor.can().sinkListItem("listItem")}
      >
        <IndentIncrease size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
        <Quote size={15} />
      </ToolbarButton>

      <Divider />

      {/* Table — insert + full editing */}
      <ToolbarDropdown title="Table" icon={<TableIcon size={15} />} label="Table">
        {(close) => (
          <>
            <MenuItem
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                close();
              }}
            >
              <Grid2x2 size={14} /> Insert table (3×3)
            </MenuItem>
            <div className="toolbar-menu__sep" />
            <MenuItem onClick={() => editor.chain().focus().addRowBefore().run()} disabled={!inTable}>
              <Rows size={14} /> Insert row above
            </MenuItem>
            <MenuItem onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!inTable}>
              <Rows size={14} /> Insert row below
            </MenuItem>
            <MenuItem onClick={() => editor.chain().focus().deleteRow().run()} disabled={!inTable}>
              <Trash2 size={14} /> Delete row
            </MenuItem>
            <div className="toolbar-menu__sep" />
            <MenuItem onClick={() => editor.chain().focus().addColumnBefore().run()} disabled={!inTable}>
              <Columns size={14} /> Insert column left
            </MenuItem>
            <MenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!inTable}>
              <Columns size={14} /> Insert column right
            </MenuItem>
            <MenuItem onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!inTable}>
              <Trash2 size={14} /> Delete column
            </MenuItem>
            <div className="toolbar-menu__sep" />
            <MenuItem onClick={() => editor.chain().focus().mergeCells().run()} disabled={!inTable}>
              <Merge size={14} /> Merge cells
            </MenuItem>
            <MenuItem onClick={() => editor.chain().focus().splitCell().run()} disabled={!inTable}>
              <Split size={14} /> Split cell
            </MenuItem>
            <div className="toolbar-menu__sep" />
            <MenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()} disabled={!inTable}>
              Toggle header row
            </MenuItem>
            <MenuItem onClick={() => editor.chain().focus().toggleHeaderColumn().run()} disabled={!inTable}>
              Toggle header column
            </MenuItem>
            <div className="toolbar-menu__sep" />
            <MenuItem
              onClick={() => {
                editor.chain().focus().deleteTable().run();
                close();
              }}
              disabled={!inTable}
            >
              <Trash2 size={14} /> Delete table
            </MenuItem>
          </>
        )}
      </ToolbarDropdown>

      {/* Insert */}
      <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
        <LinkIcon size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={insertImage} title="Insert image">
        <ImageIcon size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <Minus size={15} />
      </ToolbarButton>

      <Divider />

      {/* Clear formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
        <RemoveFormatting size={15} />
      </ToolbarButton>
    </div>
  );
}
