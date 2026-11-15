// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * A form action that cannot end in the error page.
 *
 * The server actions here turn everything the API says into a message
 * (`describeApiError`). What they cannot catch is the CALL itself failing:
 * the host cutting a request short, a deploy replacing the action mid-flight, a
 * dropped connection. Then the client throws, the nearest error boundary takes
 * over the whole page, and the person sees a crash page for something that may
 * well have worked (the first resends after the 15 October deploy sent their
 * emails and still ended there).
 *
 * This wraps the call so a failure becomes the form's own error message
 * instead, and the person can look and decide whether to try again. Only for
 * actions that RETURN a state: one that redirects is delivered by the framework
 * and not thrown here.
 */
export function guardedAction<S extends { error?: string }>(
  action: (previous: S, formData: FormData) => Promise<S>,
  message: string,
): (previous: S, formData: FormData) => Promise<S> {
  return async (previous, formData) => {
    try {
      return await action(previous, formData);
    } catch {
      return { ...previous, error: message };
    }
  };
}
