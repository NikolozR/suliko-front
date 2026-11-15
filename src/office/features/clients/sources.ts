// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Built-in acquisition sources, stored on the client by key and translated
 * under `enums.acquisitionSource`. A bureau's own sources (the "+" beside the
 * dropdown) are stored and shown as typed, as is any free text an older
 * client record still carries.
 */
export const ACQUISITION_SOURCES = ["office", "phone", "website", "recommendation", "social"] as const;
