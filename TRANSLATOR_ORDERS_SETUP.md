# Translator Orders — setup

The **Orders** tab lets translators see the documents partner bureaus assign to them in the
bureau CRM (`api.suliko.ge`), and keep orders of their own. It appears only for suliko.ge
accounts an admin has added as translators.

```
browser ──► suliko.ge /api/crm/*  ──(signed assertion)──► api.suliko.ge /api/v1/portal/*
   │         checks the suliko.ge login with content.api24.ge
   └──(ticket URL, files only)──────────────────────────► api.suliko.ge
```

Files skip the Next.js server because Vercel caps a function's request and response body at
4.5 MB. The server hands the browser a five-minute URL for one upload or download instead.

## 1. suliko-front environment (Vercel → Settings → Environment Variables)

| Variable | Value |
|---|---|
| `SULIKO_CRM_API_URL` | `https://api.suliko.ge` (no trailing `/api`) |
| `SULIKO_PORTAL_SECRET` | 32+ random characters — **the same value** as `PORTAL_SHARED_SECRET` on the API |
| `SULIKO_CRM_GATEWAY_SECRET` | the API's `BFF_SHARED_SECRET`, if it has one |
| `SULIKO_PORTAL_ADMIN_USER_IDS` | comma-separated suliko.ge user ids allowed into Admin → Translators / Organizations |
| `SULIKO_CRM_PUBLIC_URL` | optional; only if browsers reach the API at a different URL |

None of these are `NEXT_PUBLIC_`: they are read only on the server. A user id is the `id` shown
in the admin user list (the `sub` claim of the suliko.ge login token).

Admin access comes only from that allowlist, checked on the server. The role on a suliko.ge
profile is not consulted.

## 2. api.suliko.ge

- Run the migrations: `python -m suliko.cli migrate` (adds revision `0004`).
- `.env`: `PORTAL_SHARED_SECRET` (same value as above), and the suliko.ge origins in
  `CORS_ORIGINS`, e.g. `["https://app.suliko.ge","https://suliko.ge","https://www.suliko.ge","https://suliko.io","https://www.suliko.io"]`.
- The API must be served at the root of its domain: file tickets are bound to the exact path
  `/api/v1/...`.

## 3. Google Drive (per bureau)

1. In Google Cloud, create a service account for Suliko, create a JSON key, and store it on the
   API server outside the repo. Set `GOOGLE_SERVICE_ACCOUNT_FILE` to its path.
2. The bureau opens its **Shared Drive** → Manage members and adds the service account's email as
   **Content manager**. A folder in someone's My Drive will not work: a service account has no
   storage of its own.
3. In **Admin → Organizations**, paste the Shared Drive link for that bureau and save. Suliko
   checks that it can open the drive before saving.

Files are kept in `Suliko Orders / #order · client / Document · languages / Source` and
`/ Translation`. Staff can drop source files straight into a document's Source folder.
Translators' personal orders keep their files in the API database instead.

## 4. Adding a translator

1. **Admin → Translators** → search the suliko.ge account → **Add as translator**.
2. **Link to a bureau** → pick the bureau. If its directory already has this person (same phone
   or email), link that entry so existing assignments show up; otherwise create a new entry.
3. In the CRM, assign documents to that directory entry
   (`PATCH /api/v1/orders/{order}/documents/{document}` with `translator_id`). They appear in the
   translator's Orders tab: order number, client, due date, their own documents and files — no
   prices, nothing assigned to anyone else.

## Local development

`.env.local` in suliko-front:

```
SULIKO_CRM_API_URL=http://localhost:8000
SULIKO_PORTAL_SECRET=<same value as the API's PORTAL_SHARED_SECRET>
SULIKO_PORTAL_ADMIN_USER_IDS=<your suliko.ge user id>
```

The API's default `CORS_ORIGINS` already allows `http://localhost:3000`.
