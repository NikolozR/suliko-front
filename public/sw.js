/*
 * Suliko service worker. Chrome offers "Install app" only for a site
 * that has one. It caches nothing: every page and API answer is private to a
 * signed-in account, so it all comes from the network. When the network is
 * down, a page navigation gets a short offline notice instead of the browser's
 * dinosaur.
 */
const OFFLINE_PAGE =
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  "<title>Suliko</title>" +
  '<body style="font:16px system-ui;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">' +
  "<div><h1 style=\"font-size:20px\">You are offline</h1><p>Suliko needs a connection. Reconnect and try again.</p></div>";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_PAGE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }),
    ),
  );
});
