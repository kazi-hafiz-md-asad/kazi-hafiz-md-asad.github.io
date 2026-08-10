# Design / engineering changes

## 1. Research-network animation
File: `assets/js/research-field.js`

- Added a full-site Canvas 2D scientific/data-network field.
- Mouse movement repels nearby nodes, transfers pointer momentum, and changes
  local particle direction.
- Faster pointer movement creates a stronger local vector-field / swirl response.
- Nearby nodes connect dynamically with restrained lines.
- A small research-probe ring/vector appears around the mouse on desktop.

### Performance controls
The animation is intentionally dependency-free and uses:
- adaptive particle counts by viewport/device capability;
- spatial hashing instead of all-pairs O(n²) connection checks;
- at most 4 rendered links per particle;
- device-pixel-ratio cap;
- 42 FPS idle / 60 FPS while interacting on capable desktops;
- lower budgets on constrained devices;
- lazy startup via `requestIdleCallback`;
- page-visibility pause;
- debounced resize;
- static reduced-motion mode.

## 2. Shared visual integration
File: `assets/css/style.css`

- Added research-field canvas/aura layering across all pages.
- Increased visual continuity between the animated field and hero/page-hero areas.
- Added restrained transform-only card/profile hover movement.
- Avoided page-wide blur/filter effects that would increase GPU cost.

## 3. Transformer code panel
File: `assets/css/style.css`

- The “Attention Is All You Need” editor panel is forced to remain dark in both
  light and dark themes.
- Improved editor header, code-line, active-line, comment and line-number contrast.

## 4. GitHub identity correction
HTML pages + `README.md`

- Public code/repository links now point to:
  `https://github.com/donnowhattodo`
- The academic website remains hosted/canonical at:
  `https://kazi-hafiz-md-asad.github.io/`
- Contact page now distinguishes the code profile from the GitHub Pages website.
- Projects page no longer describes `donnowhattodo` as an old/archive profile.

## Tuning knobs
In `assets/js/research-field.js`, adjust the `config` object:
- `pointerRadius`: size of mouse influence field
- `linkDistance`: connection distance between nodes
- `maxLinksPerParticle`: network visual density
- `idleFPS`: background animation budget
- `activeFPS`: interactive animation budget

For a calmer academic look, lower `pointerRadius` to ~190 and
`maxLinksPerParticle` to 3. For a more aggressive effect, increase
`pointerRadius` to ~270, but keeping `maxLinksPerParticle <= 5` is recommended.
