# DSD-0006: Logo — Launch keyhole + Max wordmark

## Mark: Launch keyhole

The primary **logo mark** is the **launch keyhole** symbol:

- Circular badge (ring + fill)
- Center glyph: geometric vertical path with a single angled “notch” (keyhole / launch corridor / trajectory kink)—not a letterform
- Source reference (raster): [`media/launch-keyhole-source.jpg`](./media/launch-keyhole-source.jpg)

### Meaning (product story)

- **Keyhole** — access, unlock, control  
- **Launch path** — trajectory / mission path (agency ops going live)  
- Reads as crafted hardware icon (Icon Factory energy), not a soft consumer mascot  

### Construction (to vectorize)

| Element | Spec (intent) |
|---------|----------------|
| Outer ring | Stroke weight ~6–8% of diameter; round stroke joins |
| Disk fill | Flat or glass-tinted; high contrast vs glyph |
| Glyph | Centered vertical bar; mid offset diagonal step; equal stem widths |
| Clear space | ≥ ¼ mark diameter on all sides |
| Min size | 24px digital favicon-safe; prefer simplified glyph-only under 16px |

### Colorways (Mocha / brand)

| Variant | Ring / glyph | Fill | Use |
|---------|--------------|------|-----|
| **On light** | Dark navy / Mocha text-adjacent | Pale sky-tint (as source) | Docs, light marketing |
| **Brand sky** | Sky `#89dceb` or darker sky stroke | Mocha base / glass | Dark UI favicon, app icon |
| **Brand flamingo** | Flamingo stroke accents | Mocha base | Limited brand moments |
| **Mono light** | White / text | Transparent or crust | On photography |
| **Mono dark** | Crust / text | White disk | On light fields |

Production assets should be **SVG** (and PDF for print). Raster source is the brief lock, not the final ship format.

## Wordmark

- Text: **`Mission Control`** (or stacked `Mission` / `Control` if lockup requires)
- Type: **Max** family, weight **900** → file **`max95`** (roman); italic only if lockup explicitly needs `max96`
- Tracking: slightly open for display; optical adjust at large sizes
- Do **not** fake bold; use real `max95`
- Color: Mocha `text` on dark; crust/text on light; optional sky or flamingo single-color lockups

## Lockups

| Lockup | Composition |
|--------|-------------|
| **Horizontal** | Keyhole mark + wordmark to the right (preferred default) |
| **Stacked** | Mark above wordmark (square app / social) |
| **Mark only** | App icon, favicon, Agent tray |
| **Wordmark only** | Sparse nav when mark is already in chrome |

Gap between mark and wordmark ≈ mark radius / 2 (Ive air).

## Don’t

- Stretch mark or wordmark independently  
- Recolor glyph and ring to clashing non-token colors  
- Place on busy photos without mono knockout  
- Use Helvetica/Arial as wordmark substitute  

## Media kit deliverables (from this DSD)

- [ ] SVG keyhole (multi colorway)  
- [ ] PNG @1x/2x/3x  
- [ ] Horizontal + stacked lockups (SVG/PNG)  
- [ ] Favicon set  
- [ ] Social avatar (mark on Mocha crust / sky glass)  
- [ ] Wordmark-only SVG  

## Relationship to prior DSD questions

Supersedes “defer mark” — mark + max95 wordmark are locked; remaining work is production vectorization and kit export.
