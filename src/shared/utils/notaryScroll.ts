/**
 * Scroll to the tabbed panel and open one of its tabs — handoff §4.
 *
 * The tab is opened by a synthetic `.click()` rather than shared state so the
 * panel keeps owning its own tab selection. The tab handler reads
 * `event.isTrusted` to tell this click from a real one, which is what stops the
 * hero journey double-counting `order_start`.
 */
export function scrollToPanelTab(tab: 'calculator' | 'order'): void {
  const section = document.getElementById('calculator');
  if (!section) return;

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Long enough for the smooth scroll to settle before the panel changes height.
  window.setTimeout(() => {
    section.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.click();
  }, 700);
}

export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
