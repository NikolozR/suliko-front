# File API integration guide

For third parties translating documents through Suliko from their own product.

You call Suliko's endpoints with a Suliko Bearer token. Suliko holds the Gemini
credentials and does the upload, the measuring and the translation. You never
need a Gemini key of your own.

> This file lives in the repo on purpose. It was previously kept outside it, and
> the endpoint it documents was deleted during a refactor because nothing in the
> codebase appeared to use it — external callers then received Next's HTML 404
> page. Anything documented here is a public contract: check this file before
> removing or changing a route.

---

## The flow

```
1. POST   {API}/Document/prepare-upload          multipart, field `File`
             -> { success, fileUri, mimeType, pageCount, fileName }
2. POST   {API}/Document/translate-with-uri      JSON
             -> { jobId, chatId, ... }
3. GET    {API}/Document/translate/status/{jobId}    poll
             -> { status, stage, progress, message, estimatedRemainingMinutes }
4. GET    {API}/Document/translate/result/{jobId}
             -> the translated document
```

`{API}` is `https://content.api24.ge/api`. Every request needs
`Authorization: Bearer <your Suliko token>`.

---

## 1. Prepare the upload

```http
POST https://content.api24.ge/api/Document/prepare-upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

File=@contract.pdf
```

```jsonc
// 200
{ "success": true, "fileUri": "https://…/files/abc123",
  "mimeType": "application/pdf", "pageCount": 12, "fileName": "contract.pdf" }

// 400 no file, or over 20 MB   ·   502 upload failed
{ "success": false, "errorMessage": "..." }
```

**`pageCount` is what the translation will cost.** It is measured server-side
from the file itself; a count you calculate yourself is not used for billing.
Show this number to your user before they commit.

Limit: **20 MB**.

### Set the part's content type

The MIME type is taken from your multipart part and the file is stored under it.
Many clients default to `application/octet-stream` when handed a bare file
handle — Python `requests`, `curl -F` and a plain .NET `MultipartFormDataContent`
all do — and the translation then fails at step 2 with
`does not match parent MIME type` or `Unsupported MIME type`.

Say what the file is, e.g. in Python
`files={"File": ("contract.pdf", handle, "application/pdf")}`, and in step 2 send
back the `mimeType` this endpoint returned rather than one you chose.

Supported: PDF, PNG, JPEG, WebP, HEIC/HEIF, and plain-text formats (`text/plain`,
`text/html`, `text/markdown`, `text/csv`, `text/xml`, `application/rtf`).

`.docx` is not supported and relabelling it as PDF does not work — Gemini reads
the bytes and answers `The document has no pages.` Convert it first with
`POST {API}/Document/convert-to-pdf`.

---

## 2. Start the translation

```http
POST https://content.api24.ge/api/Document/translate-with-uri
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileUri":          "https://…/files/abc123",   // from step 1
  "mimeType":         "application/pdf",
  "fileName":         "contract.pdf",
  "TargetLanguageId": 1,
  "OutputLanguageId": 2,
  "OutputFormat":     6,
  "model":            2,
  "pageCount":        12
}
```

`OutputFormat`: `6` keeps colours, tables and styling and takes longer; `5` is
plain text and is faster. `pageCount` is accepted but ignored — the server bills
what it measured in step 1.

`model`: send `2`. Do not send `3` — it maps to a preview model Google has
retired, and now returns 404.

A `fileUri` is valid for **48 hours**. If you queue work or let a user come back
later, run step 1 again rather than reusing a stored URI.

Two failures to handle, both `400`:

| condition | what to do |
| --- | --- |
| insufficient balance | tell the user to top up; do not retry |
| the file no longer matches what was measured | start again from step 1 |

---

## 3. Poll for status

```http
GET https://content.api24.ge/api/Document/translate/status/{jobId}
```

```jsonc
{ "status": "InProgress", "stage": "translating", "progress": 25,
  "message": "...", "estimatedRemainingMinutes": 6 }
```

Prefer **`stage`** for anything you show a user: `queued`, `translating`,
`rebuilding`, `ready`, `failed`. `progress` is a coarse checkpoint (10/25/80),
not a smooth measure — do not present it as a percentage complete. `stage` is
`null` on jobs created before it was introduced.

Poll every 3 seconds or so. Stop on `Completed` or `Failed`.

---

## 4. Fetch the result

```http
GET https://content.api24.ge/api/Document/translate/result/{jobId}
```

Returns the translated document. A `400` here carries a JSON body explaining
why.

---

## When a translation fails

Read the `message` on the failed job. Do not pattern-match on its text — the
wording changes — but two phrasings are load-bearing and stable in meaning:

| the message says | what it means |
| --- | --- |
| "…sending the same file again will not help" | the model refused the content. Retrying fails identically. Documents carrying identity data are the usual cause. |
| "…please try again" | transient. Retry after a backoff. |
| "…too long to translate in one pass… split it into smaller files" | the document exceeded the output budget. Splitting is the only fix; waiting is not. |

The balance is refunded on every failure. A translation that produced nothing is
never charged.

If a failure is not self-explanatory, send Suliko the **`jobId`** and the
approximate **UTC time**. The model's own reason is recorded against that job
server-side and can be read directly; the message alone often cannot distinguish
the cases above.

> Historical note: before 2026-09, a model refusal was reported as
> `File '<gemini uri>' is empty or does not contain translatable text`, and an
> over-long document was reported as a rate limit advising a wait of some hours.
> Both were misclassifications by an error handler that matched on keywords, and
> neither described the file. If you built handling around either string, remove it.

---

## Deprecated: `POST https://suliko.ge/api/gemini-upload`

The original guide started here. It still works — multipart, field `file`,
returning `{ fileUri, mimeType, displayName }` — and now also returns
`pageCount`. It forwards to `/Document/prepare-upload`.

**Migrate to calling `prepare-upload` directly.** The shim adds a hop, and being
a Vercel route it is subject to a ~4.5 MB request-body cap that
`prepare-upload` is not — so files between 4.5 MB and 20 MB work only on the
direct route.

The JSON variant of this endpoint (`{fileName, mimeType, sizeBytes}` returning a
resumable session URL) has been **withdrawn** and returns `410`. It existed for
Suliko's own browser and required credentials the route no longer holds.
