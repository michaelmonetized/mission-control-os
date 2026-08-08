/**
 * Mission Control keymap table (DSD-0011 seed + open Q full table).
 * Command palette implements ⌘K / j/k / Enter / Esc.
 */
export const KEYMAP = [
  { keys: "⌘K / Ctrl+K", action: "Open command palette" },
  { keys: "Esc", action: "Close palette / dialog" },
  { keys: "j / ↓", action: "Palette: next item" },
  { keys: "k / ↑", action: "Palette: previous item" },
  { keys: "Enter", action: "Palette: run selected" },
  { keys: "g c", action: "Go Cockpit (palette filter)" },
  { keys: "g l", action: "Go Clients" },
  { keys: "g r", action: "Go CRM" },
  { keys: "g t", action: "Go Tasks" },
  { keys: "g a", action: "Go Audit" },
  { keys: "g s", action: "Go Social" },
  { keys: "g e", action: "Go Email" },
  { keys: "g u", action: "Go Automations" },
  { keys: "g p", action: "Go Portal setup" },
  { keys: "g o", action: "Go Onboarding" },
  { keys: "g x", action: "Go Client Portal" },
  { keys: "g ,", action: "Go Settings (palette: settings)" },
] as const;
