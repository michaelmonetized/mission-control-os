# DSD-0011: Command palette — vim + Superhuman-ish binds (spec seed)

Full command-palette product architecture may still get an **ADR** later. Brand/UX intent for the palette is **locked** here:

## Interaction model

- **Vim motions** for list/nav inside the palette and dense lists (e.g. `j`/`k`, `g`/`G`, `ctrl-d`/`ctrl-u`, numeric prefixes where natural).
- **Superhuman-ish keybinds** for global invoke and power actions (fast open, sequences, jump-to)—Raycast/Superhuman energy from DSD-0001.
- Keyboard-first; mouse secondary.

## Relationship to product

- Sparse cockpit: primary navigation/power surface is palette + binds, not wall chrome.
- Exact keymap tables, chord conflicts with browser/Electron, and Agent invoke commands → implement when app shell is built; update this DSD or add ADR with the final table.

## Not deferred anymore

Interaction *feel* (vim + Superhuman-ish) is intentional. Only exhaustive key tables and shell wiring wait on implementation.
