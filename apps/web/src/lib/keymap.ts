/**
 * Mission Control keyboard shortcuts (shown on `?`).
 * Palette open is `;` · j/k / Enter / Esc inside palette.
 */
export const KEYMAP = [
  { keys: ";", action: "Open command palette" },
  { keys: "?", action: "Show this keymap" },
  { keys: "Esc", action: "Close palette / keymap" },
  { keys: "j / ↓", action: "Palette: next item" },
  { keys: "k / ↑", action: "Palette: previous item" },
  { keys: "Enter", action: "Palette: run selected" },
  { keys: "g c", action: "Go Cockpit" },
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
  { keys: "g ,", action: "Go Settings" },
] as const;
