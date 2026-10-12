#!/usr/bin/env node
/**
 * One-time move of the blog and the passport templates out of Supabase.
 *
 * Reads every blog post (drafts included), its translations and every passport template from
 * Supabase, downloads the files they use (covers, images inside posts, template Word files), and
 * writes ONE SQL file that puts all of it into the API's database (content.api24.ge, schema
 * "ContentDb", tables from the AddBlogAndPassportTemplates migration). Image addresses inside
 * posts are rewritten to the API's /api/files/{id}.
 *
 * Run it on any computer with Node 18+, after the Supabase project is restored:
 *
 *   SUPABASE_URL=https://<project>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> \
 *     node scripts/export-supabase-content.mjs supabase-content.sql
 *
 * (Vercel has both values: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.)
 * Then run supabase-content.sql against the API's Postgres. It is safe to run twice: rows that
 * are already there are left alone. The key is only read here, never written out.
 */
import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";

const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const FILES = (process.env.API_FILES_BASE ?? "https://content.api24.ge/api/files").replace(/\/$/, "");
const OUT = process.argv[2] ?? "supabase-content.sql";

if (!SUPABASE_URL || !KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see the top of this file).");
  process.exit(1);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function rows(table, select = "*") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`, { headers });
  if (!res.ok) throw new Error(`${table}: Supabase answered ${res.status} ${await res.text()}`);
  return res.json();
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The row's own id when it is a UUID; otherwise one made from it, the same on every run. */
function uuidFor(kind, id) {
  if (UUID.test(String(id))) return String(id).toLowerCase();
  const h = createHash("sha1").update(`${kind}:${id}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const ts = (v) => (v ? `${q(new Date(v).toISOString())}::timestamptz` : "NULL");
const textArray = (a) => `ARRAY[${(a ?? []).map(q).join(", ")}]::text[]`;

const IMAGE_TYPES = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };
const WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Supabase storage addresses, including the image-transform form. */
const STORAGE = new RegExp(
  `${SUPABASE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/storage/v1/(?:object|render/image)/(?:public|authenticated|sign)/[^\\s)"'<>]+`,
  "g",
);

const isStorage = (url) => new RegExp(STORAGE.source).test(url ?? "");

const files = new Map(); // Supabase address -> { id, sql }
const problems = [];

/** Downloads a file once and answers with its address on the API, or null when it cannot be had. */
async function move(url, purpose) {
  if (!url) return null;
  if (files.has(url)) return `${FILES}/${files.get(url).id}`;
  // The key goes to Supabase only, never to an address a post happens to contain.
  const res = await fetch(url, isStorage(url) ? { headers } : {}).catch((e) => ({ ok: false, status: e.message }));
  if (!res.ok) {
    problems.push(`could not download ${url} (${res.status})`);
    return null;
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  const name = decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");
  const ext = name.split(".").pop().toLowerCase();
  const type = purpose === "passport-template" ? WORD : IMAGE_TYPES[ext];
  if (!type) {
    problems.push(`skipped ${url}: not a PNG, JPEG, WebP, GIF or DOCX`);
    return null;
  }
  const id = randomUUID();
  files.set(url, {
    id,
    sql:
      `INSERT INTO "ContentDb"."StoredFiles" ("Id", "Purpose", "FileName", "ContentType", "SizeBytes", "Data", "CreatedAt") ` +
      `VALUES (${q(id)}, ${q(purpose)}, ${q(name.slice(-255))}, ${q(type)}, ${bytes.length}, decode('${bytes.toString("hex")}', 'hex'), now()) ON CONFLICT DO NOTHING;`,
  });
  return `${FILES}/${id}`;
}

/** The text with every Supabase storage address in it replaced by the moved file's. */
async function rewrite(text) {
  if (!text) return text ?? "";
  let out = text;
  for (const url of new Set(text.match(STORAGE) ?? [])) {
    const moved = await move(url.split("?")[0], "blog-image");
    if (moved) out = out.split(url).join(moved);
  }
  return out;
}

const sql = [];
const posts = await rows("blog_posts", "*,blog_post_translations(*)");
const templates = await rows("passport_templates");

for (const p of posts) {
  const id = uuidFor("blog_posts", p.id);
  const cover = isStorage(p.cover_image) ? await move(p.cover_image.split("?")[0], "blog-image") : p.cover_image;
  sql.push(
    `INSERT INTO "ContentDb"."BlogPosts" ("Id", "CoverImage", "AuthorName", "Tags", "Status", "PublishedAt", "CreatedAt", "UpdatedAt") ` +
      `VALUES (${q(id)}, ${q(cover ?? p.cover_image ?? null)}, ${q(p.author_name ?? "")}, ${textArray(p.tags)}, ${q(p.status === "published" ? "published" : "draft")}, ` +
      `${ts(p.published_at)}, ${ts(p.created_at ?? new Date())}, ${ts(p.updated_at ?? p.created_at ?? new Date())}) ON CONFLICT DO NOTHING;`,
  );
  for (const t of p.blog_post_translations ?? []) {
    sql.push(
      `INSERT INTO "ContentDb"."BlogPostTranslations" ("Id", "PostId", "Locale", "Slug", "Title", "Excerpt", "Content") ` +
        `VALUES (${q(uuidFor("blog_post_translations", t.id ?? `${p.id}:${t.locale}`))}, ${q(id)}, ${q(t.locale)}, ${q(t.slug)}, ${q(t.title ?? "")}, ` +
        `${q(await rewrite(t.excerpt))}, ${q(await rewrite(t.content))}) ON CONFLICT DO NOTHING;`,
    );
  }
}

let templatesMoved = 0;
for (const t of templates) {
  const moved = await move(t.docx_file_url?.split("?")[0], "passport-template");
  if (!moved) {
    problems.push(`template "${t.name}" left out: its Word file could not be moved`);
    continue;
  }
  templatesMoved++;
  sql.push(
    `INSERT INTO "ContentDb"."PassportTemplates" ("Id", "Name", "Country", "DocxFileId", "FieldsJson", "IsActive", "CreatedAt", "UpdatedAt") ` +
      `VALUES (${q(uuidFor("passport_templates", t.id))}, ${q(t.name)}, ${q(t.country)}, ${q(moved.split("/").pop())}, ` +
      `${q(JSON.stringify(t.fields ?? []))}::jsonb, ${t.is_active === false ? "false" : "true"}, ${ts(t.created_at ?? new Date())}, ${ts(t.updated_at ?? t.created_at ?? new Date())}) ON CONFLICT DO NOTHING;`,
  );
}

const fileSql = [...files.values()].map((f) => f.sql);
writeFileSync(
  OUT,
  [
    `-- Blog and passport templates moved out of Supabase (${SUPABASE_URL}), ${new Date().toISOString()}.`,
    `-- ${posts.length} post(s), ${templatesMoved} template(s), ${files.size} file(s). Safe to run twice.`,
    "BEGIN;",
    ...fileSql,
    ...sql,
    "COMMIT;",
    "",
  ].join("\n"),
);

console.error(`Wrote ${OUT}: ${posts.length} post(s), ${templatesMoved} of ${templates.length} template(s), ${files.size} file(s).`);
for (const p of problems) console.error(`  ! ${p}`);
