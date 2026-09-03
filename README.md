# sheel.dev

Personal portfolio. Static HTML, CSS and vanilla JS — no build step, no framework,
no dependencies. Deployed from `main` via GitHub Pages behind Cloudflare.

## Layout

```
index.html          home — hero, about, featured-work carousel, contact
projects.html       nine project write-ups
experience.html     roles
404.html            custom not-found page (served by Pages)
styles.css          all screen + print styles, tokens in :root
site.js             nav, carousel, email copy, hero parallax
assets/             hero art, project shots, mascot, tech logos, OG card
output/pdf/         resume PDF
tools/              build helpers (not served content)
```

## Working on it

Serve the folder over HTTP — `file://` breaks the relative asset paths:

```bash
python3 -m http.server 8000
```

### Before pushing

`styles.css`, `site.js`, `assets/tech/tech.css` and `favicon.svg` are referenced with a
content-hash query string so returning visitors refetch only what actually changed.
After editing any of them:

```bash
python3 tools/bump_assets.py
```

It is idempotent — running it with nothing changed rewrites nothing.

### Regenerating the social card

`assets/og/og.png` is the 1200×630 Open Graph image, rendered from `tools/og-card.html`
so it stays in step with the site's own tokens and art:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
  --screenshot=assets/og/og.png --window-size=1200,630 --hide-scrollbars \
  --virtual-time-budget=8000 "file://$PWD/tools/og-card.html"
```

## Deploying

Push to `main`. GitHub Pages rebuilds automatically.

`CNAME` binds the custom domain — **do not delete it**, or `sheel.dev` unbinds.
`v1-final` tags the previous design if it is ever needed.

## Licence

MIT — see `LICENSE`. The Renaissance hand in the hero is a derivative of
Michelangelo's *The Creation of Adam* (public domain).
