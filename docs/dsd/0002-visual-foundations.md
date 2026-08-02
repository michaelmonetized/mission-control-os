# DSD-0002: Visual foundations — glass, Mocha, neon, skeuomorph

## Base palette

**Catppuccin Mocha** is the **chromatic substrate** (surfaces, text, semantic accents)—not the entire look.

- Base / mantle / crust for deep layers  
- Text: text, subtext0/1  
- Accents: **brand pair Flamingo + Sky** (DSD-0003 / Hustle Launch); other Mocha hues for semantics (green/red/yellow/sapphire/…)  

Exact hex token table ships in the frontend tokens package; this DSD locks the **system**. See DSD-0003 for brand accent rules.

## Material: Apple glass over Mocha

- Primary chrome: **translucent glass** (blur, thin borders, layered refraction feel) sitting **over** Mocha base fills  
- Prefer depth via layered glass cards/panels on a solid or subtly gradient Mocha void  
- Avoid opaque flat boxes as the default “card” language  

## Borders & light

- **Neon glow borders** on focus, selection, primary actions, and key live states (e.g. Crawl Run active, Conversation unread)  
- Glow is **controlled**—accent-colored, soft falloff—not rainbow cyberpunk everywhere  
- Resting state: quieter hairline glass edge; glow ramps on interaction/importance  

## Shadowing

- **Neumorphic** soft extruded/debossed shadows for tactile regions (keys, inset wells, docked modules)  
- Combine carefully with glass: neumorph for **physical controls**, glass for **panels**  
- Avoid muddy double-shadow spam; one coherent light source (top-left / soft ambient)  

## Skeuomorphism

**Skeuomorphic elements** (user term: skewmorphic) are intentional:

- Buttons, toggles, segmented controls, and key hardware metaphors may read as crafted objects  
- Icon Factory energy: beveled/gloss/subtle realism where it aids affordance  
- Not 2009 full leather-and-brushed-metal UI—**selective** skeuomorph on controls, glass for architecture  

## Motion & focus (Raycast / Superhuman)

- Instant feel: short transitions, high frame confidence, command-palette primacy  
- Focus rings use neon glow language  
- Keyboard-first affordances always visible to power users  

## Multi-surface

| Surface | Application |
|---------|-------------|
| Web / Electron | Full glass + tokens |
| iOS / Android | Same tokens; platform blur where native (UIBlur/Material) |
| TUI | Catppuccin Mocha ANSI mapping; “glow” as bold/bright accents—no fake glass |

## Client vs Agency

Same design system. Client-facing Approval Calendar may reduce neon intensity one step for calm review—not a separate cute theme (unless a later DSD says otherwise).
