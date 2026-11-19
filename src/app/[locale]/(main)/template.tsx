/**
 * A template (unlike a layout) mounts afresh on every navigation, so each
 * screen eases in: a short fade and a few pixels of lift. Reduced motion is
 * handled globally in globals.css.
 */
export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
