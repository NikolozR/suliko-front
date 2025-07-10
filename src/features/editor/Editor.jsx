/**
 * This configuration was generated using the CKEditor 5 Builder. You can modify it anytime using this link:
 * https://ckeditor.com/ckeditor-5/builder/#installation/NoNgNARATAdA7DADBSBGRAWEHWoKwAcIecAzOQJwE4V6khQHVQWNYgFQikF6EYoIAUwB2KRGGCowE2TLCoAupArFCtCIqA==
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";

import "./editor.css";

const LICENSE_KEY =
  "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NTMwNTU5OTksImp0aSI6Ijc5MzkxNDA5LWUzYWYtNDNlNy1iNDk0LTljZTI0NzI5M2I2NCIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImEzZGVkMDlmIn0.HW0PuylqjHp0UmxRW56eZUJGE_MllxufdU8Hvo_E51jbkVrKp3pgkapARSH4x1E3OdXxoXbm5xBtXtJl6sZu9Q";


export default function Editor({ value, onChange }) {
  const editorContainerRef = useRef(null);
  const editorRef = useRef(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const cloud = useCKEditorCloud({ version: "46.0.0", premium: true });

  useEffect(() => {
    setIsLayoutReady(true);

    return () => setIsLayoutReady(false);
  }, []);

  const { ClassicEditor, editorConfig } = useMemo(() => {
    if (cloud.status !== "success" || !isLayoutReady) {
      return {};
    }

    const {
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

    return {
      ClassicEditor,
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
        initialData: value || "",
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
  }, [cloud, isLayoutReady, value]);

  useEffect(() => {
    if (editorConfig) {
      configUpdateAlert(editorConfig);
    }
  }, [editorConfig]);

  return (
    <div className="main-container">
      <div
        className="editor-container editor-container_classic-editor"
        ref={editorContainerRef}
      >
        <div className="editor-container__editor">
          <div ref={editorRef}>
            {ClassicEditor && editorConfig && (
              <CKEditor
                editor={ClassicEditor}
                config={{
                  ...editorConfig,
                  initialData: value || "",
                  onChange: (event, editor) =>
                    onChange && onChange(editor.getData()),
                }}
                data={value || ""}
                onChange={(event, editor) =>
                  onChange && onChange(editor.getData())
                }
              />
            )}
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
