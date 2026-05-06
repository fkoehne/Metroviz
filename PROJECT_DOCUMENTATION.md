# Project Documentation

## 1. Technical Documentation

### Purpose and Project Structure

MetroViz is an interactive, client-side web application for creating, editing, exporting, and sharing technology roadmaps, project plans, and migrations in the visual style of a metro map.

The application represents workstreams or technologies as lines and milestones as stations. It provides both a graphical map view and a synchronized Markdown/text view.

### Architecture Overview

MetroViz is a static, serverless single page application. It runs entirely in the browser and does not require a backend service or database.

The core architecture is split into small ES module files:

- `index.html` defines the application shell, editor UI, modal structure, external library loading, and Matomo integration.
- `css/metroviz.css` contains the application styling.
- `js/app.js` initializes i18n, Alpine.js state, application modules, and rendering.
- `js/data-model.js` validates and normalizes roadmap JSON.
- `js/layout-engine.js` calculates coordinates for zones, lines, stations, and events.
- `js/metro-renderer.js` renders the SVG metro map with D3.js.
- `js/editor-actions.js` contains editor mutations for zones, lines, stations, transfers, and relations.
- `js/file-manager.js` handles local storage, JSON import/export, SVG/PNG/PDF export, and remote JSON loading.
- `js/markdown-export.js` generates the Markdown/text representation.
- `js/url-state.js` manages URL parameters and share links.
- `js/utils.js` provides shared helpers for escaping, sanitizing, dates, filenames, and downloads.
- `js/dialog.js` provides promise-based modal dialogs.

### Technologies, Libraries, and Tools

- HTML5, CSS3, and vanilla JavaScript ES modules.
- [Alpine.js](https://alpinejs.dev/) for reactive UI state.
- [D3.js](https://d3js.org/) for SVG rendering and layout-related calculations.
- [i18next](https://www.i18next.com/) with HTTP backend and browser language detection for localization.
- [lz-string](https://pieroxy.net/blog/pages/lz-string/index.html) for compressed share links.
- [marked.js](https://marked.js.org/) for Markdown parsing.
- [DOMPurify](https://github.com/cure53/DOMPurify) for HTML/SVG sanitization.
- [jsPDF](https://github.com/parallax/jsPDF) and [svg2pdf.js](https://github.com/yWorks/svg2pdf.js) for PDF export.

### Dependencies

The project has no package manager manifest and no local build step. Runtime dependencies are loaded from CDNs in `index.html`.

Recognizable runtime dependencies:

- D3.js
- Alpine.js
- i18next, i18next-http-backend, i18next-browser-languagedetector
- DOMPurify
- marked.js
- lz-string
- jsPDF
- svg2pdf.js

### Build, Runtime, and Development Dependencies

There is no compile or bundle step. For local development, the project must be served through a local HTTP server because ES modules do not work reliably from `file://` URLs.

Example:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Directory Structure

- `css/`: application stylesheet.
- `data/`: example roadmap JSON data.
- `js/`: modular application logic.
- `locales/`: translation files for German and English.
- `README.md`: public project overview and usage notes.
- `I18N_KONZEPT.md`: internationalization concept.
- `LICENSE`: MIT license.

### Configuration

MetroViz has no server-side configuration or environment variables.

Configuration is expressed through:

- URL parameters such as `editor`, `view`, `lang`, `zstate`, `data`, and `source`.
- JSON roadmap data.
- Translation files under `locales/`.
- Static script and service configuration in `index.html`, including Matomo.

### External Services and Integrations

- Matomo tracking is configured in `index.html` and points to `https://matomo.wolkenbar.de/`.
- Share links encode roadmap data directly into the URL using lz-string.
- Remote JSON import can load externally hosted roadmap JSON files if the target server allows browser access via CORS.

No backend API, user account system, server-side database, or authentication service is visible in the repository.

### Test Structure

No automated test framework is visible in the repository. The file `test.json` appears to be a sample or manual test data file.

### Technical Assumptions and Limits

- The app must be served via HTTP(S), not opened directly from the filesystem.
- Local saves use browser `localStorage`; they do not sync across devices.
- Share links may become long because they contain the compressed roadmap payload.
- Remote JSON import depends on browser CORS rules.
- Roadmap data in share links should be treated as potentially sensitive because the full data is embedded in the URL.

## 2. User Documentation

### Purpose for Users

MetroViz helps users create visual roadmap maps that make timelines, dependencies, migrations, and workstreams easier to understand.

It is useful for technical planning, migration planning, architecture roadmaps, project communication, and documentation exports.

### Recognizable Features

- Visual metro map rendering for roadmap data.
- Text/Markdown view synchronized with the roadmap structure.
- Visual editor for metadata, events, zones, lines, stations, transfers, relations, and descriptions.
- Raw JSON editor for direct data editing.
- Local save and load through browser storage.
- JSON import via file upload, drag and drop, or remote URL.
- Export as SVG, PNG, PDF, JSON, and Markdown.
- Shareable links that contain the compressed roadmap data.
- Localization for German and English.
- Collapsible zones.
- Station tooltips with dates, durations, descriptions, and Markdown-rendered content.
- Relations between stations, including dependency and synchronized-with relations.

### Typical User Flows

1. Open MetroViz in a browser.
2. Create a new roadmap or load existing JSON data.
3. Define metadata such as title, organization, and timeline.
4. Add zones to group related topics.
5. Add lines for technologies or workstreams.
6. Add stations to lines and assign dates and types.
7. Optionally define transfers and relations between stations.
8. Review the visual map or switch to the text view.
9. Save locally, export a file, or generate a share link.

### Inputs, Outputs, and Interactions

Inputs:

- Roadmap metadata.
- Timeline start and end.
- Events and deadlines.
- Zones with labels and colors.
- Lines with labels, colors, and zone assignment.
- Stations with labels, dates, types, descriptions, transfers, and relations.
- JSON files or remote JSON URLs.

Outputs:

- Interactive SVG metro map.
- Markdown/text view.
- Export files: SVG, PNG, PDF, JSON, Markdown.
- Share URL containing compressed roadmap data.

Interactions:

- Toggle editor visibility.
- Switch between map and Markdown view.
- Add, delete, move, and edit zones, lines, events, and stations.
- Collapse or expand zones.
- Highlight lines by clicking the map.
- Focus editor entries by clicking stations.

### Roles and Permissions

No roles or permissions are implemented. The application has no login system and runs as a single-user browser application.

### Usage Notes

- Use `Save` for local browser storage only.
- Use `Export JSON` for portable backups.
- Use `Share` to create a link that contains the complete roadmap payload.
- Treat share links as sensitive if the roadmap contains confidential information.
- Use JSON import/export when share links become too long for tools such as email, chat, or ticket systems.

### Known Functional Limits

- Local saves are tied to the current browser profile and device.
- There is no server-side collaboration or multi-user editing.
- There is no visible automated backup system.
- Remote imports depend on the remote server's CORS configuration.

## 3. Operations Documentation

### Runtime Requirements

MetroViz requires only a static web server capable of serving HTML, CSS, JavaScript, JSON, and locale files.

Suitable hosting options include:

- GitHub Pages
- Netlify
- Vercel
- Apache
- Nginx
- S3-compatible static hosting
- Any static CDN-backed web host

### Build and Start Process

There is no build process.

For production:

1. Deploy the repository files to a static web host.
2. Serve `index.html` as the entry point.
3. Ensure `css/`, `js/`, `data/`, and `locales/` are available at their relative paths.

For local development:

```bash
python3 -m http.server 8000
```

### Environment Variables and Secrets

No environment variables or secrets are required by the application code.

The repository contains a Matomo tracking configuration in `index.html`. Operators should review or replace it for their own deployment.

### Database and Infrastructure Dependencies

No database is required.

Roadmap persistence happens in the user's browser through `localStorage`. Exported JSON files and share links are the available portability mechanisms.

### Reverse Proxy, Ports, and Hosting

Standard HTTP/HTTPS hosting is sufficient.

If a reverse proxy is used, it should serve static assets and preserve the normal relative paths. No special API routing is required.

Recommended public deployment port:

- `443` for HTTPS

### Logging, Monitoring, and Health Checks

No application-level server logging, monitoring, or health check endpoint exists because MetroViz is a static frontend application.

Operational checks should verify that:

- `index.html` loads.
- JavaScript modules load successfully.
- Locale files under `locales/` load.
- CDN-hosted dependencies are reachable.
- CSP settings still allow the configured scripts and services.

### Backups and Persistence

Server-side backups do not cover user-created roadmap data unless users explicitly export and store JSON files.

Recommended user backup approach:

- Export important roadmaps as JSON.
- Store the JSON files in a versioned or backed-up location.
- Avoid relying only on browser local storage for long-term persistence.

### Typical Operational Pitfalls

- Opening `index.html` directly from the filesystem can fail because of ES module loading rules.
- CDN outages can affect runtime dependencies.
- Browser privacy settings can affect `localStorage`.
- Very long share URLs may fail in third-party tools.
- Remote JSON import requires CORS support from the remote server.

### Deployment Checklist

- [ ] Deploy all repository files to the static host.
- [ ] Verify that `index.html` loads over HTTP(S).
- [ ] Verify that CDN dependencies load.
- [ ] Verify that `locales/de/translation.json` and `locales/en/translation.json` load.
- [ ] Create or load a roadmap.
- [ ] Test local save and reload.
- [ ] Test JSON export and import.
- [ ] Test SVG, PNG, PDF, and Markdown export if these formats are required.
- [ ] Review or replace the Matomo tracking configuration.
- [ ] Confirm the Content Security Policy still matches the deployed environment.
