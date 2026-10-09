"use client";

import { useEffect, useState } from "react";
import { fetchPortalMe } from "./api";

// The sidebar and the phone nav both ask, on every page: one question per sign-in.
let asked: { token: string; answer: Promise<boolean> } | null = null;

function isTranslator(token: string): Promise<boolean> {
  if (asked?.token !== token) {
    asked = {
      token,
      answer: fetchPortalMe().then((result) => result.status === "ok" && result.data.is_translator),
    };
  }
  return asked.answer;
}

/**
 * Does a bureau work with the signed-in person as a translator? Decides whether
 * the Orders tab exists. Any failure answers "no": the tab is simply left out.
 */
export function useIsTranslator(token: string | null | undefined): boolean {
  const [answer, setAnswer] = useState(false);

  useEffect(() => {
    if (!token) {
      setAnswer(false);
      return;
    }
    let cancelled = false;
    isTranslator(token).then((value) => {
      if (!cancelled) setAnswer(value);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return answer;
}
