# Kazi Hafiz Md. Asad — Research Portfolio

A self-contained academic and research website prepared for:

`https://kazi-hafiz-md-asad.github.io`

The site is plain HTML, CSS, and JavaScript. It does not require Ruby, Jekyll, npm, or a custom GitHub Actions workflow.

## Repository requirement

Use the GitHub account:

`kazi-hafiz-md-asad`

Create or use a **public** repository named exactly:

`kazi-hafiz-md-asad.github.io`

## Deploy with GitHub Pages

1. Extract the ZIP file.
2. Open the `kazi-hafiz-md-asad.github.io` repository.
3. Delete the old website files first if you are replacing an earlier version.
4. Upload **all files and folders inside the extracted folder** to the repository root.
5. Commit the files to `main`.
6. Open **Settings → Pages**.
7. Under **Build and deployment**, select **Deploy from a branch**.
8. Select branch `main` and folder `/ (root)`.
9. Click **Save**.
10. Wait for the Pages deployment to finish, then open `https://kazi-hafiz-md-asad.github.io`.

## Add your professional photograph

1. Name the photograph `Asad_1.png`.
2. Upload it to `assets/img/Asad_1.png`.
3. Open `assets/js/site-config.js`.
4. Change:

```javascript
showProfilePhoto: false
```

to:

```javascript
showProfilePhoto: true
```

Recommended format: a vertical professional portrait, approximately 800 × 1000 pixels or larger.

## Add the CV later

1. Name the PDF `Kazi_Hafiz_Md_Asad_CV.pdf`.
2. Upload it to `assets/pdf/Kazi_Hafiz_Md_Asad_CV.pdf`.
3. Open `assets/js/site-config.js`.
4. Change:

```javascript
showCV: false
```

to:

```javascript
showCV: true
```

The CV buttons will appear automatically.

## Included pages

- `index.html` — academic homepage and About page
- `research.html` — research agenda, methods, and current directions
- `publications.html` — papers, preprint, and manuscripts
- `projects.html` — research and technical projects with filters
- `experience.html` — education, research, teaching, professional experience, and skills
- `contact.html` — email and profile directory
- `404.html` — custom error page

## Important profile links

All public code and research repositories are linked to:

`https://github.com/donnowhattodo`

The academic website itself is hosted with GitHub Pages at:

`https://kazi-hafiz-md-asad.github.io/`

The About and Contact pages also include Google Scholar, LinkedIn, LeetCode, Deep-ML, and X.

## Customization files

- `assets/css/style.css` — complete visual design and responsive layout
- `assets/js/main.js` — dark mode, menus, reveal animations, filters, and copy-email action
- `assets/js/research-field.js` — adaptive interactive research-network background
- `assets/js/site-config.js` — CV and profile-photograph switches
- `assets/img/profile-placeholder.svg` — temporary researcher portrait illustration
- `robots.txt` and `sitemap.xml` — search-engine discovery

## Interactive research background

The site uses a custom Canvas 2D research-network effect rather than a third-party
particle library. This avoids an external CDN/dependency and keeps the effect
performance-aware: adaptive particle counts, spatial hashing for local connections,
capped device-pixel ratio, lower idle frame rate, full-rate interaction only while
the pointer is active, page-visibility pausing, lazy startup after first paint, and
`prefers-reduced-motion` support.

## Before replacing your currently published site

If the old site is hosted under a different account, that site will remain online until you remove or disable it. The new website must be uploaded to the repository owned by `kazi-hafiz-md-asad`.
