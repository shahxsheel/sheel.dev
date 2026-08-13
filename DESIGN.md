# DESIGN.md — sheel.dev
**Read this file at the start of every session. Do not invent design values. If a value you need is not here, add it here first, then use it.**
---
## 1. What this is
A single-page, static personal site for Sheel Shah, built as a photorealistic monochrome "coffee table" scene from ~2004. Physical objects on the table act as navigation.
**Target roles:** Forward Deployed Engineer.
**The site's job is not to be the portfolio.** GitHub is the substance. This site is a personality artifact and a funnel — it should make someone smile, then send them to GitHub. Optimize for memorability and shareability over completeness.
**Success looks like:** a recruiter finds the resume in 5 seconds, an engineer clicks around for 90 seconds and shares the link.
---
## 2. Non-negotiables
These survive every redesign. Nothing below may compromise them.
1. Name, one-line positioning, and a working Resume link are visible on first paint without interaction.
2. A plain-text escape hatch exists — anyone can reach resume + GitHub without touching the scene.
3. Every path through the site eventually offers GitHub.
4. Site works with JavaScript disabled to the extent of showing name, links, and text content.
5. Nothing on the table is clickable unless it is a real `<a>` or `<button>` with an accessible label.
---
## 3. Scope
### v1 (ship this, then stop)
- Base plate hero with UI chrome overlay
- Two hotspots: **magazine → Work Experience**, **binder → Projects**
- Hotspots open real pages at real URLs (no animation yet)
- Projects and experience rendered from JSON
- Invert toggle
- Mobile fallback
- Deployed to the real domain
### Explicitly NOT in v1
Binder open animation, magazine page-flip, parallax, GitHub API integration, additional clickable objects, custom handwriting font.
Everything cut goes in `later.md` with a one-line note. Do not build ahead.
---
## 4. Aesthetic constants
### 4.1 Color
Strict monochrome. No color values outside this list, ever. No accent color, no colored links.

```css
--black:      #000000;  /* page bg; matches plate vignette exactly — must stay pure */
--near-black: #0A0A0A;
--panel:      #121212;
--line:       #262626;
--mute:       #6E6E6E;
--soft:       #A8A8A8;
--paper:      #D8D8D8;
--white:      #FFFFFF;
```

`--black` must remain `#000000`. The plate's vignette falls off to pure black, and the page background is what makes it bleed seamlessly at any viewport size. Changing it breaks the whole responsive strategy.

**Measured correction (v1).** The shipped plate does *not* reach pure black at its edges — sampled means: left 12.8 (peak 220), right 8.1, top 4.7, bottom 13.5. Against `#000000` letterbox bars that reads as a grey seam. The falloff is therefore *produced*, not assumed, by a gradient overlay on `#stage` — see `--plate-falloff` in §5.1. Re-measure if the plate is ever re-rendered.
### 4.2 Type
Three faces. No fourth face.
| Role | Family | Notes |
|---|---|---|
| Display / UI | `Archivo` (variable) | Name, nav, headings. Tight tracking. |
| Body / meta | `JetBrains Mono` | Small text, labels, the `>` prefixed lines, dates, captions. |
| Handwriting | `Permanent Marker` (placeholder) | Disc labels only. Replace with custom font — see 4.3. |
Self-host all three in `/assets/fonts`. No Google Fonts CDN calls — it's a privacy and reliability tax for three files.

Do not use the Hagrid trial files on the site: the trial fonts inject visible `TRIAL ONLY` watermark glyphs into rendered copy. A future Hagrid switch requires licensed, watermark-free webfont files.

```css
--fs-name:   clamp(28px, 2.6vw, 44px);   /* Sheel Shah */
--fs-h1:     clamp(24px, 2.2vw, 38px);
--fs-h2:     clamp(18px, 1.4vw, 24px);
--fs-body:   16px;
--fs-meta:   13px;
--fs-micro:  11px;   /* uppercase, tracked +0.12em */
--tracking-tight: -0.02em;   /* display */
--tracking-wide:   0.12em;   /* micro / uppercase labels */
--leading-tight:   1.15;
--leading-body:    1.6;
```

Display text is uppercase-safe but not uppercase by default. Micro labels are always uppercase + `--tracking-wide`.
### 4.3 Handwriting
`Permanent Marker` is a **placeholder**, not the target. The real version: write project names on paper with a Sharpie, scan at 600dpi, and build a font via Calligraphr named `SheelHand`. Swap the `--font-hand` variable and nothing else changes.
Whatever the face, disc labels must get:

```css
transform: rotate(var(--disc-rot));   /* random −3deg … +3deg per disc, from JSON */
opacity: 0.88;                        /* never pure white — ink soaks */
```

Clean vector type on a photographic disc is the #1 tell. The rotation and opacity variance are what sell it.
### 4.4 Grain & texture
One global grain overlay, fixed, non-interactive, above everything:

```css
--grain-opacity: 0.055;
--grain-blend: overlay;
--grain-size: 180px;   /* tile size */
```

Generate with inline SVG `feTurbulence` (`baseFrequency="0.8" numOctaves="3"`), not an image file. `pointer-events: none; position: fixed; inset: 0; z-index: 9000;`
Any raster image added to the site gets this filter chain so it matches the plate:

```css
--img-filter: grayscale(1) contrast(1.12) brightness(0.96);
```

True halftone is baked into assets at generation time. Do not attempt halftone in CSS.
### 4.5 Contact shadows

**Cut-out art needs `drop-shadow`, not `box-shadow`.** `--shadow-object` traces the element's rectangle, so on art with transparent corners it draws a floating box instead of the object's silhouette. Use `--shadow-object-drop` (identical values, expressed as chained `drop-shadow()` filters) on any object with alpha, combined with `--img-filter` in one `filter` declaration, drop-shadow last so it is cast from the already-filtered silhouette. `--shadow-object-drop-hover` supplies the "slightly deeper shadow" §4.6 asks for but never quantified: offsets and blur ×1.45, alpha +0.04.

**Every composited object layer requires a contact shadow.** An object with no shadow floats and instantly reads as pasted. This is the single most common failure mode of this build.

```css
--shadow-object: 0 18px 34px rgba(0,0,0,0.62), 0 4px 10px rgba(0,0,0,0.5);
```

Light on the plate is diffuse and slightly overhead — shadows fall short, soft, and mostly downward. Do not use directional or hard shadows.
### 4.6 Motion
Restrained. This is a photograph, not a toy.

```css
--dur-fast:  150ms;
--dur-base:  240ms;
--dur-slow:  420ms;
--ease:      cubic-bezier(0.2, 0.0, 0.0, 1.0);
```

Hover on a table object: `translateY(-4px) scale(1.012)` plus a slightly deeper shadow. Nothing more. No rotation, no glow, no bounce.
All motion must respect `prefers-reduced-motion: reduce` — drop to opacity-only or none.
### 4.7 Spacing
8px base scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`. Nothing off-scale.
---
## 5. Layout architecture
### 5.1 The stage
The scene lives in one aspect-locked container. Everything on the table is positioned inside it in **percentages**, never pixels.

```
<body>                      background: var(--black)
  <div id="stage">          the viewport-facing frame; position: relative
    <div class="chrome">    UI text — name, nav, status (absolute to #stage)
    <div class="plate">     the photograph; aspect-ratio + background image
      <a class="object" …>  magazine   (percentages of .plate)
      <a class="object" …>  binder
  </div>
  <div class="grain">
```

**Stage and plate are two boxes, and the split matters.** `#stage` is the frame the viewport sees; `.plate` is the photograph inside it. The stage is at least `100svh` tall and the plate sits on its floor at every viewport size, so any aspect-ratio letterboxing becomes black sky above the table rather than a dead border below it. **Chrome positions against the stage and objects position against the plate**. Chrome therefore tracks the viewport corners while objects stay pinned to the table, with no coordinate drift. Collapsing these back into one element re-breaks that.
`.plate` must stay a positioned element: it is the objects' `offsetParent`, which is what debug mode measures against (§5.3).

Object positioning contract — every object uses these five custom properties, and nothing else:

```html
<a class="object" style="--x:22%; --y:14%; --w:24%; --ar:17/22; --r:-1.2deg">
```


```css
.object {
  position: absolute;
  left: var(--x); top: var(--y); width: var(--w);
  aspect-ratio: var(--ar, 3 / 4);
  transform: rotate(var(--r, 0deg));
}
```

`--ar` is the object's footprint on the table, added in v1. Width alone gives a hotspot no height, and a fixed ratio for every object is wrong once the objects differ (a magazine is not a CD binder). In v2 the art's natural ratio takes over; keeping `--ar` reserves the box and prevents layout shift while the image loads.

**Plate edge falloff.** `#stage::after` lays four linear-gradients over the plate's outer `--plate-falloff` (3%) so the photograph resolves to `--black` on every side, then bleeds into the page. It sits at `z-index: 5` — below objects (10) and chrome (20) — so neither is dimmed. Without it, letterboxing at any viewport that isn't exactly 16:9 exposes a hard grey rectangle (see §4.1).

**Why this matters:** in v1 these are flat hotspots. In v2 the same elements become animated PNG layers. Same coordinate system, zero rework. Do not use image maps, pixel coordinates, or canvas.
### 5.1.1 Objects with art
Both objects have shipped as real art, alpha-cut, AVIF + WebP:
| Art | Source | AVIF | WebP |
|---|---|---|---|
| `magazine.*` | 1024×1262 | 101 KB | 191 KB |
| `binder-closed.*` | 1000×987 | 116 KB | 252 KB |
The binder was downscaled from 1243px to 1000px: it renders ~480 CSS px at the 1920 stage cap, so 1000px still covers 2× displays, and the full-size export cost 528 KB of WebP for detail no one can see. **Size object art to ~2× its rendered width, not to whatever the export gives you.**
The rules, applied to both:
- **Add `.object--art`.** It drops the hairline, the wash and the box-shadow, leaving exactly what §4.6 specifies: lift plus a deeper shadow. A hairline rectangle drawn around a cut-out magazine reads as a rendering bug.
- **Delete the `.object__label`.** The cover already says *Work Experience*; the label was a stand-in for missing art. The link's `aria-label` carries the accessible name, so the art is decorative.
- **Set `--r: 0deg`.** The tilt is baked into the artwork. Leaving the authored rotation would double it.
- **Set `--ar` to the art's own ratio** (`1024 / 1262`), including its transparent margin, so the box is reserved before the image loads and the coordinates keep meaning the same thing. **Re-measure on every art swap and update both places** — the inline style in `index.html` *and* the portrait override in `stage.css`. A revised export changed the trimmed ratio from 0.766 to 0.811; a stale `--ar` leaves `background-size: contain` letterboxing the art inside a mismatched box, which reads as the object drifting off its coordinates.
- Art loads as a `background-image` with `image-set()`, matching the plate, and must be **trimmed tight** (`magick -trim`) — asymmetric transparent padding silently offsets the object from where `--x/--y` say it is.

### 5.2 Coordinates
Tuned against the real plate in v1. The plate's empty centre runs **x 18–83%, y 7–66%** — bounded by the iPod left, the mug right, the table's top edge, and the Sharpie/notepad cluster below. Both objects must stay inside it.
| Object | `--x` | `--y` | `--w` | `--ar` | `--r` | art |
|---|---|---|---|---|---|---|
| Magazine | 23% | 18% | 22% | 1024 / 1262 | 0deg | shipped |
| Binder | 52% | 15% | 27% | 1000 / 987 | 20deg | shipped |
Both `--ar` values are the artwork's own ratio.

**`--r` fights the artwork's baked-in tilt, so it is not the angle you see.** Both images were authored tilted *counter-clockwise* — measurable as the topmost opaque pixel sitting on the right-hand side of the frame — so at `--r: 0` the two objects read as parallel. The binder's `+20deg` first cancels its own tilt and only then leans it clockwise, splaying the pair into a shallow **V**. A value that looks large in the stylesheet can be small on screen; judge it rendered, and check which way a new artwork leans before choosing a number.

**Rotation inflates the bounding box, and the box is what collides.** At 20deg the binder's box grows ~6% wider and ~14% taller than `--w`/`--ar` imply, which is why `--x`/`--y` had to back off and why the portrait widths in §9.1 were narrowed — the un-rotated values left the two objects touching. After changing any `--r`, re-measure the *rendered* rect, not the declared size.

**Measure the clear band per column, never for the plate as a whole** — what sits below each object differs:
| Column | Clear band | Obstruction below |
|---|---|---|
| Magazine, x 23–45% | y 5–69% | Sharpie |
| Binder, x 53–78% | y 6–72% | film strip |
Resulting rendered boxes: magazine 23–45% / 18–66.2%, binder (rotated) 48.3–82.7% / 8.2–69.2%. Clearances: 3.3% between the two, 2.8% from the binder to the film strip, 2.3% from the binder to the mug.
Placement is a judgement call, so **render it and look before settling**: the mathematically centred position read as top-heavy against the busy cluster along the bottom of the plate, and sitting both objects low in their bands looked right.

**Verify placement by measurement, not by eye.** Sample the plate's luminance under any block before trusting it — a chrome block over a light object is invisible in a thumbnail and obvious on a real screen. The bottom-left status block originally ran to 31.9% and overlapped the notepad, which begins at **24.1%** (22.3% of its area was light pixels). It is now capped at `max-width: 21%`.
### 5.3 Debug mode
Pressing `d` toggles `body.debug`, which outlines every `.object` with a 1px white border and prints its `--x/--y/--w` in the corner. Tuning coordinates by hand without this is miserable. Build it early.
### 5.4 UI chrome placement
Matches the approved mockup:
- **Top left:** `Sheel Shah` (display), then two-line tagline in mono, then a `↗` glyph
- **Top right:** `About` `Resume` `Contact` (mono, sentence case), a vertical rule, then `Invert` + toggle
- **Bottom left:** three `>` prefixed mono lines — positioning statement, `California, USA`, `Available for work` with a filled dot
All chrome sits on pure black plate area at full white. Do not add scrims or backdrop blurs — the plate is already dark enough.
Chrome type is fixed px while the plate scales in %, so every block creeps rightward/downward across the photograph as the stage narrows. Constrain blocks in % (`max-width`) rather than trusting a given string's length, and keep the positioning line short.

**Hotspot labels.** Until object art lands, the `.object__label` is the only thing marking a hotspot. It is visible at rest in `--white` — not `--soft`: the labels sit on lit table texture (peak luminance ~110) where `--soft` falls to 2.1:1 and fails §10. Hover/focus adds the hairline, wash, lift and shadow rather than a colour change.
---
## 6. Invert

```css
html.invert { filter: invert(1); }
```

Inverts the photograph along with the UI, which is the intended effect. Persist the choice in `localStorage` under `sheel.invert`. Apply the class in an inline script in `<head>` before first paint to avoid a flash.
Caveat: `filter` on an ancestor creates a new containing block, so `position: fixed` children resolve against `<html>`. Keep the grain overlay outside any transformed wrapper, or accept it inverting too (it should — it's part of the image).

### 6.1 Wandering star

The supplied monochrome star periodically crosses every site page along a randomized cubic path. It is ambient only: fixed to the viewport, ignored by assistive technology, and never receives pointer events.

- Star size: `clamp(48px, 5vw, 80px)`
- Crossing duration: random `3.8s–6.2s`
- Delay between crossings: random `2.5s–7s`; first appearance after `0.8s–2.2s`
- Paths begin and end `96px` beyond different viewport edges. Control points follow the inward and outward edge tangents at `35%` of the crossing distance, with a shared perpendicular bend of at most `18%`; this prevents loops and direction reversals.
- Motion advances through a `120`-sample arc-length lookup rather than raw Bézier time, keeping perceived speed steady through bends.
- Trail lifetime: `1.6s`
- Trail core: `24px`, round capped, tapered, and subtly pulsed in width and opacity as it expires
- Sparkle field: four-point glints sized `2–7px`, scattered up to `24px` from the path with independently phased shimmer
- Leading shimmer: a smaller four-point glint pulsing between `6–10px` beneath the moving star
- Trail and sparkle color: white on a `mix-blend-mode: difference` canvas, which inverts the current rendered colors and fades back to normal as each mark ages
- Layering: trail at `z-index: 9100`, star at `9101`, debug UI remains above both at `9500`
- `prefers-reduced-motion: reduce`: do not create or animate the effect

The animation lives in `/scripts/star-trail.js`. It must be included on every HTML route so navigation never drops the effect.

### 6.2 Y2K cursors

Use the supplied Desaparezco Windows animated-cursor family: `Desaparezco.ani` for the default arrow, `Desaparezco_link.ani` for interactive links and buttons, and `Desaparezco_busy.ani` during internal page transitions. Keep the original files in `/assets/cursors` as sources.

Browsers do not reliably support `.ani`, particularly on macOS, so each file's four embedded `32×32` frames is extracted to PNG. `/scripts/cursor-ani.js` reproduces the authored `0,1,2,3,2,1` ping-pong sequence at `167ms` per step. Hotspots are `0 0` for the arrow, `11 0` for the hand's fingertip, and `16 16` for the hourglass. Standard `default`, `pointer`, and `wait` cursors remain as fallbacks. Reduced-motion mode holds all three cursors on frame `0`.

Unmodified primary clicks on same-tab navigation links are deliberately held for `500ms`: the current page remains visible with the animated busy cursor, then navigation continues. Modifier clicks, downloads, new-tab links, and same-page anchors retain normal browser behavior. Buttons perform their action immediately but show the busy cursor for the same `500ms` feedback window.

Primary mouse clicks play `/assets/audio/mouse-click.mp3` immediately at `0.45` volume. Three preloaded audio voices rotate so rapid clicks can overlap without cutting each other off. Keyboard-initiated activation stays silent. The sound does not change or extend the existing `500ms` navigation delay.

Interior prose uses the Desaparezco arrow, while selectable or editable text keeps the native text caret. Every custom cursor declaration ends with a standard cursor fallback.
---
## 7. Content model
Content is data, never hardcoded markup. This is what makes v2 cheap.
`/content/projects.json`

```json
[
  {
    "slug": "driver-monitoring-system",
    "disc": "01",
    "title": "Driver Monitoring System",
    "blurb": "A concise, factual project summary.",
    "stack": ["Python", "MediaPipe"],
    "repo": "https://github.com/…",
    "live": null,
    "rotation": -2.1,
    "body": "content/projects/driver-monitoring-system.md"
  }
]
```

`/content/experience.json` — same idea: `company`, `role`, `start`, `end`, `location`, `bullets[]`, `body`.
Rules:
- Max **4 projects** on the binder page. This is a deliberate stance — "four of them, the rest is on GitHub" — and it also caps the asset problem permanently. Additional projects go in a plain text list below.
- `rotation` is authored per project, not random at runtime, so the layout is stable between loads.
- Long-form project text lives in markdown files, parsed at build or rendered as pre-formatted HTML. Do not put paragraphs in JSON.
---
## 8. Interior pages
The scene is the shell. **Interiors are clean and readable — this is where recruiters actually read.**
- Max line length 68ch
- `--paper` text on `--black`, `--fs-body`, `--leading-body`
- Editorial rhythm from the magazine reference: generous margins, a strong `--fs-h1`, mono metadata line, hairline `--line` rules. No collage, no scattered objects, no textures beyond the global grain.
- Every project page ends with a GitHub link.
- Back navigation is always visible and always says where it goes ("← back to the table").
Resist the Wired reference here. The cover is Wired; the interior is closer to a well-set essay.
---
## 9. Responsive
| Breakpoint | Behavior |
|---|---|
| ≥ 1024px | Full stage. The scene as designed. |
| 768–1023px | Stage still shown, chrome type scales down, hotspots enlarge to 44px minimum touch target. |
| < 768px | **The scene, re-orientated.** `#stage` switches to `aspect-ratio: 9 / 16` and the portrait plate. Same chrome in the same corners, same objects, same contract — only the aspect and the coordinates change. Nothing below the stage. |

**Nothing sits below the stage.** The text list that used to live there read as a slab of dead black under the plate and was cut, along with the `> best viewed on a desktop at 1024 × 768` line — that joke apologised for a degraded fallback, and there is no fallback any more. Non-negotiable #2 is now carried by the chrome itself: Resume and Contact in the top-right nav, and a fourth `>` status line linking `github.com/shahxsheel` bottom-left. All are plain `<a>`, so §2 and #4 hold with JS off.

The GitHub link went into the status block rather than the nav because the nav has no room for a fourth item (see the 343px note above) and a second nav row lands on the mug — measured peak luminance 211 at x 30–96% / y 5–8%. The status band at y 87–90% measures clear (1.3% bright) on the portrait plate, and the four-line block measures clear on the landscape plate too (means 13–18, ≤0.1% bright).

**The table sits on the floor; the leftover height is black sky above it.** In portrait the stage is `100svh` with `align-items: flex-end`, so the plate is bottom-anchored and the letterbox becomes composed negative space rather than a gap. The name, tagline and nav land in that black band — full white on `#000000`, the cleanest contrast on the site. Bottom-anchored **portrait only**: a landscape phone is shorter than the plate is tall, and anchoring to the floor there would push the top of the table off-screen.

**Never "fix" the band by cropping.** A 9:16 plate cannot fill a 19.5:9 phone. Filling the height with `background-size: cover` crops ~9% off each side, and **the iPod sits at x 2.7–16%**, so that crop slices it in half. It also makes the object-to-plate mapping depend on the device's aspect, which is exactly what aspect-locking prevents. The plate stays whole and the coordinates stay deterministic.

**Superseded twice — read this before touching mobile.** The original rule was "top 30% crop of the desktop plate, do not reflow the scene." That predates the portrait plate (`table-base-mobile.*`, 941×1672), which is the desk *recomposed* for 9:16 — a second authored view, not a crop. **Mobile now shows the real scene, and the table must never be covered.** Specifically:

- **No scrim, no fade, no overlay over the table.** An earlier pass put the name on the plate behind a `linear-gradient` to `--black`; it hid most of the desk and was rejected. The photograph is the point. The only permitted overlay is the 3% `--plate-falloff` at the very edges (§5.1).
- **Chrome keeps its corners.** Name top-left, `About / Resume / Contact` + Invert top-right, `>` status lines bottom-left — identical roles to desktop.
- **The text list lives *below* the stage**, never on it. It exists for non-negotiable #2 (resume + GitHub without touching the scene) and for JS-off.
- **The top row is the binding constraint.** At 375px there are 343px between the margins, and the brand plus nav need exactly 343px — they collide at desktop sizing. The brand drops to `--fs-body` and the Invert button hides its text label (keeping its `aria-label`) to buy ~18px of gap. Re-measure this row before changing any chrome type size.

### 9.1 Portrait coordinates
The portrait plate's empty centre is **x 20–95%, y 20–68%** — bounded by the mug above, the iPod and stickers left, and the Sharpie/notepad/stub cluster below.
| Object | left | top | width | aspect-ratio |
|---|---|---|---|---|
| Magazine | 22% | 9% | 40% | 1024 / 1262 |
| Binder | 45% | 44.5% | 34% | 1000 / 987 |

**Portrait stacks the objects on a diagonal, not side by side.** Magazine high, binder low, their centres at x 42% and x 62% — just off the horizontal centre on either side, with a 5.1% vertical gap between the boxes.
Sizes were set by growing each box around its centre until it touched something, then backing off: the ceilings are ~52% for the magazine and 38% for the binder (the binder's limited by the bottom cluster, not by width). Shipped at 40% and 34%, which leaves 3.9% before that cluster and keeps both on bare table (0.15% and 0.04% bright pixels). Side by side stopped working once the binder's 20deg tilt widened its bounding box: the two closed to a 0.3% gap, and narrowing them enough to fit left both objects small on an already narrow plate. The diagonal uses the portrait plate's tall empty middle instead, and both boxes land on bare table (0.1% and 0.0% bright pixels).
`--r` is inherited from the inline style here — portrait overrides `left/top/width/aspect-ratio` only — so any change to the binder's rotation moves this layout too.
Set as **real properties inside the media query, not custom properties** — `--x/--y/--w` are inline on the element, and inline custom properties always beat a stylesheet. The binder's `top` is tuned so both labels share a centreline: with no object art the labels are all you see, and a 4px stagger reads as a mistake rather than as objects lying casually on a table.
Debug mode (§5.3) therefore reports **computed** `offset*` geometry, not the inline custom properties, so the readout stays true in both orientations.
---
## 10. Accessibility
Non-optional, and cheap if done from the start.
- Table objects are `<a>` elements with real `href`s and `aria-label` ("Work Experience — magazine")
- Visible focus ring: `outline: 2px solid var(--white); outline-offset: 4px`
- Tab order follows visual reading order
- The plate is `background-image` (decorative). Any content-bearing image gets real `alt`
- Contrast: all UI text is `--white` or `--paper` on near-black — verify ≥ 4.5:1 after adding grain
- `prefers-reduced-motion` honored everywhere
- Invert toggle is a real `<button>` with `aria-pressed`
---
## 11. Performance
| Budget | Target |
|---|---|
| Plate image | ≤ 400 KB AVIF, WebP fallback |
| Total JS | ≤ 15 KB uncompressed |
| Total CSS | ≤ 20 KB |
| LCP | < 1.8s on 4G |
| Fonts | 3 files, `woff2`, `font-display: swap`, subset to Latin |
Preload the plate: `<link rel="preload" as="image" href="…" fetchpriority="high">`, split by `media` so portrait and landscape viewports each fetch only their own plate.
Serve the plate at 2560px wide max. Anything larger is invisible under grain.

**Shipped v1 assets** (source 1672×941 and 941×1672, well under the 2560 cap — do not upscale):
| File | AVIF | WebP |
|---|---|---|
| `table-base` | 224 KB | 280 KB |
| `table-base-mobile` | 240 KB | 304 KB |

CSS declares plain WebP first, then `image-set()` with `type("image/avif")`; browsers that don't parse `image-set` keep the WebP. Encoded at q58/q84 — the grain overlay hides anything finer.

**Encode with ImageMagick, and verify the pixels.** macOS `sips` writes AVIF files that are correct in dimensions and plausible in file size but decode to **pure black**. This survives every cheap check — `ls`, `sips -g`, even a 200 OK in the network panel — and only shows up on screen. After any conversion, confirm real content:
```bash
magick out.avif -format "%[fx:mean]" info:   # must be ≳0.1, not 0
```
Also hard-reload after replacing an image: a cached broken asset looks identical to a broken build.
---
## 12. Stack
Deliberately boring. **No framework, no build step, no CMS, no dependencies.**
Static HTML, CSS with custom properties, vanilla JS. Real folders for real URLs. Deploys to Vercel/Netlify/GitHub Pages with zero configuration.

Production CSS references carry a deployment version query. The custom domain is proxied through Cloudflare, which caches unversioned stylesheets for hours; bump the version whenever a stylesheet changes so visitors do not receive a mixed HTML/CSS deployment.

The favicon uses the downloaded chrome pixel star on black, cropped to fill a 64px square with a 2px safety inset. Version its URL whenever the icon changes because browsers cache favicons particularly aggressively.

```
/
├── index.html
├── work/index.html
├── projects/index.html
├── projects/[slug]/index.html
├── about/index.html
├── assets/
│   ├── plate/table-base.avif|webp
│   ├── objects/            ← magazine.webp, binder-closed.webp (v2)
│   └── fonts/
├── styles/
│   ├── tokens.css          ← every value in section 4 lives here, and only here
│   ├── base.css
│   ├── stage.css
│   └── pages.css
├── scripts/
│   ├── stage.js            ← hotspots, debug mode
│   └── invert.js
├── content/
│   ├── projects.json
│   ├── experience.json
│   └── projects/*.md
├── DESIGN.md
└── later.md
```

If a build step ever becomes genuinely necessary, use Vite and nothing else.
---
## 13. Rules for AI coding sessions
1. **Read this file first.** Every session.
2. **Never invent a design value.** No new colors, fonts, durations, shadows, or spacing. If something is missing, propose it, add it to `tokens.css` and this file, then use it.
3. **All design values live in `tokens.css`.** No magic numbers in component CSS. If you find one, hoist it.
4. **Do not build ahead of scope.** Anything not in section 3's v1 list goes in `later.md` as a single line.
5. **Do not add dependencies.** Not a utility library, not a font loader, not an animation library.
6. **Percentages, never pixels,** for anything positioned on the stage.
7. **Every object layer gets a contact shadow.** See 4.5.
8. **Ship every session.** The site must be deployable and non-broken at the end of each working session, even if incomplete.
9. When unsure whether something is too much: it is. This site earns its charm from one strong idea executed cleanly, not from accumulated effects.
---
## 14. Open decisions
Log choices here as they're made so future sessions don't relitigate them.
- [ ] Domain
- [ ] Magazine cover portrait — use Sheel's own photo, halftoned (preferred over synthetic face)
- [ ] Final four projects for the binder
- [ ] Custom `SheelHand` font — build or stay on `Permanent Marker`
- [x] **Plate** — `BOM → SFO / FLIGHT 815` variant, landscape + a dedicated portrait companion. Both shipped as AVIF + WebP.
- [x] **`--ar` added to the object contract** (§5.1) — objects have different footprints; a single fixed ratio was wrong.
- [x] **Plate edge falloff produced in CSS** (§4.1, §5.1) — the asset does not reach pure black at its edges.
- [x] **Mobile is a portrait hero with the name overlaid**, not a 30% crop of the landscape plate (§9).
- [x] **Hotspot labels visible at rest in `--white`** (§5.4) — required for both discoverability and contrast.

Production content is sourced from the portfolio copy and project notes. The public GitHub profile is `github.com/shahxsheel`, and the resume is stored at `assets/Sheel-Shah-Resume.pdf`.
