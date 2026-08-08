import { useEffect, useState } from "react";
import { KEYMAP } from "@/lib/keymap";

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

/**
 * Keymap help — only when pressing `?` (not while typing in fields).
 */
export function KeymapOverlayHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      setOpen((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close shortcuts"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-[28rem] rounded-[var(--radius-lg)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-mantle)] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--color-mocha-text)]">Keyboard shortcuts</h2>
          <kbd className="text-[10px] font-mono text-[var(--color-mocha-subtext0)]">? / Esc</kbd>
        </div>
        <ul className="grid gap-1.5 text-xs font-mono text-[var(--color-mocha-subtext0)] sm:grid-cols-1">
          {KEYMAP.map((k) => (
            <li key={k.keys} className="flex gap-3">
              <span className="min-w-[6.5rem] text-[var(--color-brand-sky)]">{k.keys}</span>
              <span className="font-sans text-[var(--color-mocha-text)]">{k.action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
