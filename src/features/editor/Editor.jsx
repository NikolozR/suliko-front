/**
 * This configuration was generated using the CKEditor 5 Builder. You can modify it anytime using this link:
 * https://ckeditor.com/ckeditor-5/builder/#installation/NoNgNARATAdA7DADBSBGRAWEHWoKwAcIecAzOQJwE4V6khQHVQWNYgFQikF6EYoIAUwB2KRGGCowE2TLCoAupArFCtCIqA==
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";

import "./editor.css";

const LICENSE_KEY = process.env.NEXT_PUBLIC_CKEDITOR_LICENSE_KEY;



export default function Editor({ translatedMarkdown, onChange }) {
  const editorContainerRef = useRef(null);
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [error, setError] = useState(null);
  const cloud = useCKEditorCloud({ version: "46.0.0", premium: true });

  // Debug: Log cloud status
  useEffect(() => {
    if (cloud.status === "error") {
      console.error('CKEditor Cloud error:', cloud);
      setError('Failed to load CKEditor');
    } else if (cloud.status === "success") {
      console.log('CKEditor Cloud loaded. Available editors:', Object.keys(cloud.CKEditor || {}));
      setError(null);
    }
  }, [cloud]);

  useEffect(() => {
    setIsLayoutReady(true);

    return () => setIsLayoutReady(false);
  }, []);

  const { DocumentEditor, editorConfig } = useMemo(() => {
    if (cloud.status !== "success" || !isLayoutReady) {
      return {};
    }

    // Check what's available in cloud.CKEditor
    if (!cloud.CKEditor) {
      console.error('CKEditor cloud object not available');
      return {};
    }

    // DocumentEditor might not be available in Cloud, fallback to ClassicEditor if needed
    const {
      DocumentEditor: DocEditor,
      ClassicEditor,
      Autoformat,
      AutoImage,
      Autosave,
      BlockQuote,
      Bold,
      CloudServices,
      Code,
      Emoji,
      Essentials,
      FontBackgroundColor,
      FontColor,
      FontFamily,
      FontSize,
      Heading,
      Highlight,
      ImageBlock,
      ImageCaption,
      ImageEditing,
      ImageInline,
      ImageInsertViaUrl,
      ImageResize,
      ImageStyle,
      ImageTextAlternative,
      ImageToolbar,
      ImageUpload,
      ImageUtils,
      Indent,
      IndentBlock,
      Italic,
      Link,
      LinkImage,
      List,
      ListProperties,
      Mention,
      Paragraph,
      PlainTableOutput,
      RemoveFormat,
      Strikethrough,
      Subscript,
      Superscript,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableLayout,
      TableProperties,
      TableToolbar,
      TextTransformation,
      TodoList,
      Underline,
    } = cloud.CKEditor;
    const { FormatPainter } = cloud.CKEditorPremiumFeatures;

    // Use DocumentEditor if available, otherwise fallback to ClassicEditor
    // Note: DocumentEditor might not be available in Cloud CDN
    const EditorToUse = DocEditor || ClassicEditor;
    
    if (!EditorToUse) {
      console.error('Neither DocumentEditor nor ClassicEditor is available');
      console.log('Available in cloud.CKEditor:', Object.keys(cloud.CKEditor || {}));
      return {};
    }

    // Log which editor we're using
    if (DocEditor) {
      console.log('Using DocumentEditor');
    } else {
      console.log('DocumentEditor not available, using ClassicEditor with document-like styling');
    }

    return {
      DocumentEditor: EditorToUse,
      editorConfig: {
        toolbar: {
          items: [
            "undo",
            "redo",
            "|",
            "formatPainter",
            "|",
            "heading",
            "|",
            "fontSize",
            "fontFamily",
            "fontColor",
            "fontBackgroundColor",
            "|",
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "subscript",
            "superscript",
            "code",
            "removeFormat",
            "|",
            "emoji",
            "link",
            "insertTable",
            "insertTableLayout",
            "highlight",
            "blockQuote",
            "|",
            "bulletedList",
            "numberedList",
            "todoList",
            "outdent",
            "indent",
          ],
          shouldNotGroupWhenFull: true,
        },
        plugins: [
          Autoformat,
          AutoImage,
          Autosave,
          BlockQuote,
          Bold,
          CloudServices,
          Code,
          Emoji,
          Essentials,
          FontBackgroundColor,
          FontColor,
          FontFamily,
          FontSize,
          FormatPainter,
          Heading,
          Highlight,
          ImageBlock,
          ImageCaption,
          ImageEditing,
          ImageInline,
          ImageInsertViaUrl,
          ImageResize,
          ImageStyle,
          ImageTextAlternative,
          ImageToolbar,
          ImageUpload,
          ImageUtils,
          Indent,
          IndentBlock,
          Italic,
          Link,
          LinkImage,
          List,
          ListProperties,
          Mention,
          Paragraph,
          PlainTableOutput,
          RemoveFormat,
          Strikethrough,
          Subscript,
          Superscript,
          Table,
          TableCaption,
          TableCellProperties,
          TableColumnResize,
          TableLayout,
          TableProperties,
          TableToolbar,
          TextTransformation,
          TodoList,
          Underline,
        ],
        fontFamily: {
          supportAllValues: true,
        },
        fontSize: {
          options: [10, 12, 14, "default", 18, 20, 22],
          supportAllValues: true,
        },
        heading: {
          options: [
            {
              model: "paragraph",
              title: "Paragraph",
              class: "ck-heading_paragraph",
            },
            {
              model: "heading1",
              view: "h1",
              title: "Heading 1",
              class: "ck-heading_heading1",
            },
            {
              model: "heading2",
              view: "h2",
              title: "Heading 2",
              class: "ck-heading_heading2",
            },
            {
              model: "heading3",
              view: "h3",
              title: "Heading 3",
              class: "ck-heading_heading3",
            },
            {
              model: "heading4",
              view: "h4",
              title: "Heading 4",
              class: "ck-heading_heading4",
            },
            {
              model: "heading5",
              view: "h5",
              title: "Heading 5",
              class: "ck-heading_heading5",
            },
            {
              model: "heading6",
              view: "h6",
              title: "Heading 6",
              class: "ck-heading_heading6",
            },
          ],
        },
        image: {
          toolbar: [
            "toggleImageCaption",
            "imageTextAlternative",
            "|",
            "imageStyle:inline",
            "imageStyle:wrapText",
            "imageStyle:breakText",
            "|",
            "resizeImage",
          ],
        },
        licenseKey: LICENSE_KEY,
        link: {
          addTargetToExternalLinks: true,
          defaultProtocol: "https://",
          decorators: {
            toggleDownloadable: {
              mode: "manual",
              label: "Downloadable",
              attributes: {
                download: "file",
              },
            },
          },
        },
        list: {
          properties: {
            styles: true,
            startIndex: true,
            reversed: true,
          },
        },
        mention: {
          feeds: [
            {
              marker: "@",
              feed: [
                /* See: https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html */
              ],
            },
          ],
        },
        placeholder: "Type or paste your content here!",
        table: {
          contentToolbar: [
            "tableColumn",
            "tableRow",
            "mergeTableCells",
            "tableProperties",
            "tableCellProperties",
          ],
        },
      },
    };
  }, [cloud, isLayoutReady]);

  useEffect(() => {
    if (editorConfig) {
      configUpdateAlert(editorConfig);
    }
  }, [editorConfig]);

  // Keep the editor content in sync with external state changes
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    const incoming = translatedMarkdown || "";
    const current = editor.getData();
    if (current !== incoming) {
      editor.setData(incoming);
    }
  }, [translatedMarkdown]);

  // Show loading state
  if (cloud.status === "loading" || !isLayoutReady) {
    return (
      <div className="main-container">
        <div className="editor-container editor-container_document-editor p-8 text-center">
          <p>Loading editor...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (cloud.status === "error" || error) {
    return (
      <div className="main-container">
        <div className="editor-container editor-container_document-editor p-8 text-center text-red-500">
          <p>Error loading editor. Please refresh the page.</p>
          {error && <p className="text-sm mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  // Show message if editor not available
  if (!DocumentEditor || !editorConfig) {
    return (
      <div className="main-container">
        <div className="editor-container editor-container_document-editor p-8 text-center">
          <p>Editor is initializing...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Cloud status: {cloud.status}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div
        className="editor-container editor-container_document-editor"
        ref={editorContainerRef}
      >
        <div className="editor-container__editor">
          <div ref={editorRef}>
            <CKEditor
              editor={DocumentEditor}
              config={editorConfig}
              onReady={(editor) => {
                editorInstanceRef.current = editor;
                editor.setData(translatedMarkdown || "");
              }}
              onChange={(event, editor) => {
                onChange && onChange(editor.getData());
              }}
              onError={(error, { willEditorRestart }) => {
                console.error('CKEditor error:', error);
                if (willEditorRestart) {
                  editorInstanceRef.current = null;
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * This function exists to remind you to update the config needed for premium features.
 * The function can be safely removed. Make sure to also remove call to this function when doing so.
 */
function configUpdateAlert(config) {
  if (configUpdateAlert.configUpdateAlertShown) {
    return;
  }

  const isModifiedByUser = (currentValue, forbiddenValue) => {
    if (currentValue === forbiddenValue) {
      return false;
    }

    if (currentValue === undefined) {
      return false;
    }

    return true;
  };

  const valuesToUpdate = [];

  configUpdateAlert.configUpdateAlertShown = true;

  if (!isModifiedByUser(config.licenseKey, "<YOUR_LICENSE_KEY>")) {
    valuesToUpdate.push("LICENSE_KEY");
  }

  if (valuesToUpdate.length) {
    window.alert(
      [
        "Please update the following values in your editor config",
        "to receive full access to Premium Features:",
        "",
        ...valuesToUpdate.map((value) => ` - ${value}`),
      ].join("\n")
    );
  }
}
