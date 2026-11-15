"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_TIMEZONE } from "@office/shared/lib/dates";

/**
 * The bureau's timezone, for Client Components that format timestamps.
 *
 * Server Components pass `session.timezone` to the date helpers directly.
 * Client Components have no session, and formatting in the browser's own zone
 * would disagree with the server-rendered text beside it (and trip a
 * hydration mismatch), so the shell provides the zone here.
 */
const TimezoneContext = createContext<string>(DEFAULT_TIMEZONE);

export function TimezoneProvider({ timeZone, children }: { timeZone: string; children: ReactNode }) {
  return <TimezoneContext.Provider value={timeZone}>{children}</TimezoneContext.Provider>;
}

export function useTimezone(): string {
  return useContext(TimezoneContext);
}
