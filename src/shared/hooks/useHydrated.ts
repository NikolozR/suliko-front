import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False in the server HTML and until React has taken the page over, true after.
 * Forms with a password disable their submit button until then: the page is
 * visible before it is interactive, and a submit in that gap is a plain browser
 * GET of the form, which puts the typed password in the address bar and the
 * server logs and runs none of the validation.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
