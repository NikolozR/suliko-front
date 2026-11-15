"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { registerLicense } from "@syncfusion/ej2-base";
import {
  DocumentEditorContainerComponent,
  Ribbon,
  Toolbar,
  type ToolbarItem,
} from "@syncfusion/ej2-react-documenteditor";
import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from "react";

// The editor's own style sheets: the container pulls widgets from several
// packages, and each brings its own. Loaded with this component, which is only
// ever imported where the editor is shown, never for the rest of the app.
// The Fluent 2 theme, which is Office's own look and, unlike Material, fetches
// no web font from Google (the page's content security policy would refuse it).
import "@syncfusion/ej2-fluent2-theme/styles/base/base.css";
import "@syncfusion/ej2-fluent2-theme/styles/button/button.css";
import "@syncfusion/ej2-fluent2-theme/styles/check-box/check-box.css";
import "@syncfusion/ej2-fluent2-theme/styles/radio-button/radio-button.css";
import "@syncfusion/ej2-fluent2-theme/styles/switch/switch.css";
import "@syncfusion/ej2-fluent2-theme/styles/input/input.css";
import "@syncfusion/ej2-fluent2-theme/styles/textbox/textbox.css";
import "@syncfusion/ej2-fluent2-theme/styles/textarea/textarea.css";
import "@syncfusion/ej2-fluent2-theme/styles/numerictextbox/numerictextbox.css";
import "@syncfusion/ej2-fluent2-theme/styles/maskedtextbox/maskedtextbox.css";
import "@syncfusion/ej2-fluent2-theme/styles/popup/popup.css";
import "@syncfusion/ej2-fluent2-theme/styles/spinner/spinner.css";
import "@syncfusion/ej2-fluent2-theme/styles/dialog/dialog.css";
import "@syncfusion/ej2-fluent2-theme/styles/tooltip/tooltip.css";
import "@syncfusion/ej2-fluent2-theme/styles/drop-down-base/drop-down-base.css";
import "@syncfusion/ej2-fluent2-theme/styles/drop-down-list/drop-down-list.css";
import "@syncfusion/ej2-fluent2-theme/styles/combo-box/combo-box.css";
import "@syncfusion/ej2-fluent2-theme/styles/auto-complete/auto-complete.css";
import "@syncfusion/ej2-fluent2-theme/styles/multi-select/multi-select.css";
import "@syncfusion/ej2-fluent2-theme/styles/list-view/list-view.css";
import "@syncfusion/ej2-fluent2-theme/styles/list-box/list-box.css";
import "@syncfusion/ej2-fluent2-theme/styles/calendar/calendar.css";
import "@syncfusion/ej2-fluent2-theme/styles/datepicker/datepicker.css";
import "@syncfusion/ej2-fluent2-theme/styles/timepicker/timepicker.css";
import "@syncfusion/ej2-fluent2-theme/styles/color-picker/color-picker.css";
import "@syncfusion/ej2-fluent2-theme/styles/slider/slider.css";
import "@syncfusion/ej2-fluent2-theme/styles/toolbar/toolbar.css";
import "@syncfusion/ej2-fluent2-theme/styles/tab/tab.css";
import "@syncfusion/ej2-fluent2-theme/styles/menu/menu.css";
import "@syncfusion/ej2-fluent2-theme/styles/context-menu/context-menu.css";
import "@syncfusion/ej2-fluent2-theme/styles/drop-down-button/drop-down-button.css";
import "@syncfusion/ej2-fluent2-theme/styles/split-button/split-button.css";
import "@syncfusion/ej2-fluent2-theme/styles/button-group/button-group.css";
import "@syncfusion/ej2-fluent2-theme/styles/h-scroll/h-scroll.css";
import "@syncfusion/ej2-fluent2-theme/styles/v-scroll/v-scroll.css";
import "@syncfusion/ej2-fluent2-theme/styles/toast/toast.css";
import "@syncfusion/ej2-fluent2-theme/styles/message/message.css";
import "@syncfusion/ej2-fluent2-theme/styles/ribbon/ribbon.css";
import "@syncfusion/ej2-fluent2-theme/styles/document-editor/document-editor.css";
import "@syncfusion/ej2-fluent2-theme/styles/document-editor-container/document-editor-container.css";

// The licence key is version-specific (it must be for the major version
// installed, 35) and is meant to be in the browser's code: it is a public
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
  print(): void;
}

/**
 * The Word editor: Syncfusion's Document Editor, working on the translation
 * itself, so what is corrected here is what the client is sent.
 *
 * It is told the document in the editor's own format (the API has suliko.ge's
 * backend turn the stored .docx into it) and writes a .docx in the browser; it
 * is given no server of its own to call, so what needs one (spelling, pasting
 * Word's formatting from outside, opening other files) is not offered.
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
  /** The element that scrolls the pages, as it appears and goes. */
  scrollerRef?: (element: HTMLElement | null) => void;
  /** What the parent calls to get the document out (see `WordEditorHandle`). */
  handle?: Ref<WordEditorHandle>;
}) {
  const container = useRef<DocumentEditorContainerComponent>(null);
  // Opening a document raises the same event as editing it: ignored until it is open.
  const opened = useRef(false);

  useImperativeHandle(
    handle,
    () => ({
      toDocx: async () => {
        const editor = container.current?.documentEditor;
        if (!editor) throw new Error("The editor is not ready.");
        return editor.saveAsBlob("Docx");
      },
      print: () => container.current?.documentEditor.print(),
    }),
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
      documentEditorSettings={{ showRuler: mode === "full" }}
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
