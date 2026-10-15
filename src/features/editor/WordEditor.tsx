"use client";

import { registerLicense } from "@syncfusion/ej2-base";
import {
  DocumentEditorContainerComponent,
  Ribbon,
  Toolbar,
  type ToolbarItem,
} from "@syncfusion/ej2-react-documenteditor";
import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { sfdtToHtml } from "./sfdtToHtml";

// The editor's own style sheets: the container pulls widgets from several
// packages, and each brings its own. Loaded with this component, which is only
// ever imported where the editor is shown, never for the rest of the site.
// The Fluent 2 theme, which is Office's own look and, unlike Material, fetches
// no web font from Google.
import "@syncfusion/ej2-base/styles/fluent2.css";
import "@syncfusion/ej2-buttons/styles/fluent2.css";
import "@syncfusion/ej2-inputs/styles/fluent2.css";
import "@syncfusion/ej2-popups/styles/fluent2.css";
import "@syncfusion/ej2-lists/styles/fluent2.css";
import "@syncfusion/ej2-navigations/styles/fluent2.css";
import "@syncfusion/ej2-splitbuttons/styles/fluent2.css";
import "@syncfusion/ej2-dropdowns/styles/fluent2.css";
import "@syncfusion/ej2-calendars/styles/fluent2.css";
import "@syncfusion/ej2-notifications/styles/fluent2.css";
import "@syncfusion/ej2-ribbon/styles/fluent2.css";
import "@syncfusion/ej2-documenteditor/styles/fluent2.css";

// The licence key is version-specific (it must be for the major version
// installed, 34) and is meant to be in the browser's code: it is a public
// build-time setting, not a secret. Without one the editor runs in evaluation
// mode and says so on the page.
const licenseKey = process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY;
if (licenseKey) registerLicense(licenseKey);

// The short toolbar for the editor beside the original, the ribbon for the full page.
DocumentEditorContainerComponent.Inject(Toolbar, Ribbon);

/**
 * The toolbar of the compact editor beside the original: what is wanted for
 * correcting a translation in place. The full page has the whole ribbon.
 */
const COMPACT_ITEMS: ToolbarItem[] = [
  "Undo",
  "Redo",
  "Separator",
  "Image",
  "Table",
  "Hyperlink",
  "Separator",
  "Header",
  "Footer",
  "PageSetup",
  "PageNumber",
  "Break",
  "Separator",
  "Find",
];

export interface WordEditorHandle {
  /** The document as it stands now, as a Word file. */
  toDocx(): Promise<Blob>;
  /** The document in the editor's own format (JSON text), for opening it again as it is. */
  serialize(): string;
  /** The document as the plain HTML the rest of the site works on (see `sfdtToHtml`). */
  getHTML(): string;
  print(): void;
  /** Replaces every occurrence of the text; answers how many there were. */
  replaceText(find: string, replacement: string): number;
  /** Selects the first occurrence and scrolls to it, or clears the mark with null. */
  highlight(text: string | null): void;
}

/**
 * The Word editor: Syncfusion's Document Editor, working on the translation
 * itself, so what is corrected here is what the client is sent.
 *
 * It is told the document in the editor's own format (Api24 turns the
 * translation's HTML into it) and writes a .docx in the browser; it is given no
 * server of its own to call, so what needs one (spelling, pasting Word's
 * formatting from outside, opening other files) is not offered.
 *
 * Client only: it reaches for `window` when it loads. A parent shows it through
 * `next/dynamic` with `ssr: false`, which does not pass a `ref` on, so the
 * handle is an ordinary prop.
 */
export default function WordEditor({
  sfdt,
  mode,
  readOnly = false,
  onChange,
  onOpened,
  scrollerRef,
  handle,
}: {
  /** The document, as the API sends it: the editor's JSON text. */
  sfdt: string;
  /** The whole ribbon (full page) or the short toolbar (beside the original). */
  mode: "full" | "compact";
  readOnly?: boolean;
  /** Called when the person changes the document, not when it is opened. */
  onChange?: () => void;
  /** Called once the document is open (and again if another is opened in its place). */
  onOpened?: () => void;
  /** The element that scrolls the pages, as it appears and goes. */
  scrollerRef?: (element: HTMLElement | null) => void;
  /** What the parent calls to get the document out (see `WordEditorHandle`). */
  handle?: Ref<WordEditorHandle>;
}) {
  const container = useRef<DocumentEditorContainerComponent>(null);
  // Opening a document raises the same event as editing it: ignored until it is open.
  const opened = useRef(false);
  const onOpenedRef = useRef(onOpened);
  onOpenedRef.current = onOpened;

  useImperativeHandle(
    handle,
    () => {
      const editor = () => {
        const found = container.current?.documentEditor;
        if (!found) throw new Error("The editor is not ready.");
        return found;
      };
      return {
        toDocx: async () => editor().saveAsBlob("Docx"),
        serialize: () => editor().serialize(),
        getHTML: () => sfdtToHtml(editor().serialize()),
        print: () => editor().print(),
        replaceText: (find, replacement) => {
          const search = editor().search;
          if (!search || !find.trim()) return 0;
          search.findAll(find, "None");
          const count = search.searchResults?.length ?? 0;
          if (count > 0) search.searchResults.replaceAll(replacement);
          search.searchResults?.clear();
          return count;
        },
        highlight: (text) => {
          const search = container.current?.documentEditor.search;
          if (!search) return;
          if (!text?.trim()) {
            search.searchResults?.clear();
            return;
          }
          search.findAll(text.trim(), "None");
          if ((search.searchResults?.length ?? 0) > 0) search.searchResults.index = 0;
        },
      };
    },
    [],
  );

  const open = useCallback(() => {
    const editor = container.current?.documentEditor;
    if (!editor) return;
    opened.current = false;
    editor.open(sfdt);
    editor.isReadOnly = readOnly;
    // Beside the original there is room for a page's width, not for a page at
    // its size: the page is made to fit.
    if (mode === "compact") window.setTimeout(() => editor.fitPage("FitPageWidth"), 250);
    // The first change event of a document is its being opened.
    window.setTimeout(() => {
      opened.current = true;
      onOpenedRef.current?.();
    }, 300);
  }, [sfdt, readOnly, mode]);

  // Opened when the editor exists, and again if the document is replaced.
  const created = useRef(false);
  useEffect(() => {
    if (created.current) open();
  }, [open]);

  // The element that scrolls the pages, the editor's own, for whoever keeps
  // the original beside it at the same place.
  const found = useRef<HTMLElement | null>(null);
  const reportScroller = useCallback(() => {
    found.current =
      container.current?.element.querySelector<HTMLElement>('[id$="_editor_viewerContainer"]') ??
      null;
    scrollerRef?.(found.current);
  }, [scrollerRef]);
  useEffect(() => () => scrollerRef?.(null), [scrollerRef]);

  // The pane beside the original changes width with the window: refit the page.
  useEffect(() => {
    const element = container.current?.element;
    if (mode !== "compact" || !element) return;
    let timer: number | undefined;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => container.current?.documentEditor.fitPage("FitPageWidth"), 200);
    });
    observer.observe(element);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [mode]);

  return (
    <DocumentEditorContainerComponent
      ref={container}
      height="100%"
      width="100%"
      enableToolbar
      toolbarMode={mode === "full" ? "Ribbon" : "Toolbar"}
      toolbarItems={mode === "compact" ? COMPACT_ITEMS : undefined}
      showPropertiesPane={mode === "full"}
      // Long key names: `sfdtToHtml` reads those.
      documentEditorSettings={{ showRuler: mode === "full", optimizeSfdt: false }}
      locale="en-US"
      created={() => {
        created.current = true;
        open();
        reportScroller();
      }}
      contentChange={() => {
        if (opened.current) onChange?.();
      }}
    />
  );
}
