// Run with: npm run test:unit  (Node strips the types itself, no build step)
import assert from "node:assert/strict";
import { test } from "node:test";
import { htmlToPlainText, sfdtToHtml } from "./sfdtToHtml.ts";

const run = (text, characterFormat) => ({ text, characterFormat });
const paragraph = (inlines, paragraphFormat = {}) => ({ paragraphFormat, inlines });
const document = (blocks, extra = {}) => ({
  sections: [{ blocks }],
  characterFormat: { fontFamily: "Calibri", fontSize: 11 },
  styles: [{ name: "Normal", type: "Paragraph", characterFormat: { fontFamily: "Calibri", fontSize: 11 } }],
  ...extra,
});

test("headings, paragraphs and the marks on a run", () => {
  const html = sfdtToHtml(
    document([
      paragraph([run("გამარჯობა")], { styleName: "Heading 1" }),
      paragraph([
        run("Hello "),
        run("bold", { bold: true }),
        run(" "),
        run("it", { italic: true, underline: "Single" }),
        run(" "),
        run("red", { fontColor: "#FF0000FF" }),
      ]),
    ]),
  );
  assert.equal(
    html,
    '<h1>გამარჯობა</h1><p>Hello <strong>bold</strong> <em><u>it</u></em> <span style="color:#ff0000">red</span></p>',
  );
});

test("the editor's automatic colour and its own font are not written out", () => {
  const html = sfdtToHtml(
    document([
      paragraph([
        run("a", { fontColor: "#00000000", fontFamily: "Calibri", fontSize: 11 }),
        run("b", { fontFamily: "Sylfaen", fontSize: 14 }),
      ]),
    ]),
  );
  assert.equal(html, '<p>a<span style="font-family:Sylfaen;font-size:14pt">b</span></p>');
});

test("alignment, from the paragraph or from its style", () => {
  const html = sfdtToHtml({
    ...document([
      paragraph([run("one")], { textAlignment: "Center" }),
      paragraph([run("two")], { styleName: "Right text" }),
      paragraph([run("three")], { textAlignment: "Left" }),
    ]),
    styles: [
      { name: "Normal", type: "Paragraph" },
      { name: "Right text", type: "Paragraph", basedOn: "Base", paragraphFormat: {} },
      { name: "Base", type: "Paragraph", paragraphFormat: { textAlignment: "Right" } },
    ],
  });
  assert.equal(html, '<p style="text-align:center">one</p><p style="text-align:right">two</p><p>three</p>');
});

test("text is escaped, tabs and line breaks kept, page breaks dropped", () => {
  const html = sfdtToHtml(document([paragraph([run("a < b & c > d\u000bnext\ttab\f")])]));
  assert.equal(html, "<p>a &lt; b &amp; c &gt; d<br>next&nbsp;&nbsp;&nbsp;&nbsp;tab</p>");
});

test("an empty paragraph stays one", () => {
  assert.equal(sfdtToHtml(document([paragraph([])])), "<p></p>");
});

const lists = {
  lists: [
    { listId: 0, abstractListId: 0 },
    { listId: 1, abstractListId: 1 },
  ],
  abstractLists: [
    { abstractListId: 0, levels: [{ listLevelPattern: "Bullet" }, { listLevelPattern: "Bullet" }] },
    { abstractListId: 1, levels: [{ listLevelPattern: "Arabic" }, { listLevelPattern: "LowLetter" }] },
  ],
};
const item = (text, listId, listLevelNumber) => paragraph([run(text)], { listFormat: { listId, listLevelNumber } });

test("bullets, nested bullets and a numbered list", () => {
  const html = sfdtToHtml(
    document(
      [
        item("one", 0, 0),
        item("two", 0, 0),
        item("nested", 0, 1),
        item("three", 0, 0),
        paragraph([run("between")]),
        item("first", 1, 0),
        item("second", 1, 0),
      ],
      lists,
    ),
  );
  assert.equal(
    html,
    "<ul><li><p>one</p></li><li><p>two</p><ul><li><p>nested</p></li></ul></li><li><p>three</p></li></ul>" +
      "<p>between</p><ol><li><p>first</p></li><li><p>second</p></li></ol>",
  );
});

test("a list that changes kind at the same depth is two lists", () => {
  const html = sfdtToHtml(document([item("dot", 0, 0), item("one", 1, 0)], lists));
  assert.equal(html, "<ul><li><p>dot</p></li></ul><ol><li><p>one</p></li></ol>");
});

test("lettered sublevels carry their numbering type", () => {
  const html = sfdtToHtml(document([item("a", 1, 0), item("b", 1, 1)], lists));
  assert.equal(html, '<ol><li><p>a</p><ol type="a"><li><p>b</p></li></ol></li></ol>');
});

test("a table with a merged cell, a shaded cell and a paragraph in a cell", () => {
  const cell = (blocks, cellFormat = {}) => ({ blocks, cellFormat });
  const html = sfdtToHtml(
    document([
      {
        rows: [
          { cells: [cell([paragraph([run("wide")])], { columnSpan: 2 })] },
          {
            cells: [
              cell([paragraph([run("a")])], { shading: { backgroundColor: "#D9D9D9FF" } }),
              cell([paragraph([run("b")])], { rowSpan: 2 }),
            ],
          },
        ],
      },
      paragraph([run("after")]),
    ]),
  );
  assert.equal(
    html,
    '<table><tbody><tr><td colspan="2"><p>wide</p></td></tr>' +
      '<tr><td style="background-color:#d9d9d9"><p>a</p></td><td rowspan="2"><p>b</p></td></tr></tbody></table><p>after</p>',
  );
});

test("a link is the field it is made of", () => {
  const html = sfdtToHtml(
    document([
      paragraph([
        run("see "),
        { fieldType: 0 },
        run(' HYPERLINK "https://suliko.ge/a?b=1&c=2" '),
        { fieldType: 2 },
        run("Suliko", { underline: "Single" }),
        { fieldType: 1 },
        run("."),
      ]),
    ]),
  );
  assert.equal(html, '<p>see <a href="https://suliko.ge/a?b=1&amp;c=2"><u>Suliko</u></a>.</p>');
});

test("an image keeps its data and its size", () => {
  const html = sfdtToHtml(document([paragraph([{ imageString: "data:image/png;base64,AAAA", width: 72, height: 36 }])]));
  assert.equal(html, '<p><img src="data:image/png;base64,AAAA" width="96" height="48"></p>');
});

test("text that is not the editor's JSON is refused", () => {
  assert.throws(() => sfdtToHtml("not json"));
});

test("plain text, line by line", () => {
  const html = "<h1>Title</h1><p>a &amp; b<br>c</p><ul><li><p>x</p></li></ul><table><tr><td>1</td><td>2</td></tr></table>";
  assert.equal(htmlToPlainText(html), "Title\na & b\nc\nx\n1\t2");
});
