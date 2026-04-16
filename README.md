# MetroViz

MetroViz is a highly interactive, client-side web application for creating, editing, and sharing technology roadmaps, project plans, and migrations in the visual style of a **Metro Map (Subway Map)**. 

<img width="2792" height="1404" alt="image" src="https://github.com/user-attachments/assets/4dbca948-92e0-48d6-b023-6043bc9a5c76" />

[Demo](https://rstockm.github.io/Metroviz/?editor=0&view=map&lang=en&zstate=12)

By representing workstreams or technologies as "Lines" and milestones as "Stations," MetroViz makes complex timelines and dependencies instantly understandable. It also features a dual-view approach, offering both the graphical map and a fully synchronized Markdown/Text version of the roadmap.

## 🌟 Key Features

* **Visual Metro Map Rendering:** Automatically routes lines and avoids label collisions using D3.js.
* **Dual Views:** Switch seamlessly between the visual Metro Map and a structured **Markdown (Text) View**. Both views update in real-time.
* **Interactive Editor:** A split-screen UI that allows you to edit data via user-friendly forms or by directly editing the underlying raw JSON.
* **Advanced Routing & Transfers:**
  * Define explicit **Transfers** to migrate from one technology/line to another (automatically establishes bidirectional links).
  * Draw complex **Relations** like *Depends On* (arrows) and *Synchronized With* (dashed lines) across the map.
  * Fade out obsolete lines (`tint`), mark non-milestone stops (`isStop`), and flip labels to avoid overlaps.
* **Export Capabilities:** 
  * **Images & Documents:** High-res PNG, scalable SVG, and PDF exports.
  * **Data:** JSON (for backups/imports) and Markdown (for documentation).
* **Local Storage & Privacy First:** All data is saved directly in your browser's `localStorage`. No backend database is required.
* **Shareable URLs:** The entire roadmap state (including UI layout choices like collapsed zones) is compressed (via LZ-String) directly into a shareable URL.
* **Localization (i18n):** Full support for multiple languages (currently German and English). Language state is preserved in the URL (`?lang=en`).

---

## 📚 Core Concepts & Data Model

MetroViz relies on a structured JSON data model. Here are the core concepts you will find in the editor:

1. **Meta & Timeline:** 
   Define the title of your roadmap and the visible time span on the X-axis (e.g., `2026-Q1` to `2027-Q4`).
2. **Global Events:** 
   Vertical lines spanning the entire map to indicate hard deadlines, fiscal year ends, or major milestones.
3. **Zones (Thematic Clusters):** 
   Horizontal bands (Y-axis) that group related lines together. Zones can be assigned background colors and can be collapsed to save space.
4. **Lines (Technologies / Workstreams):** 
   The actual "subway lines." Each line has a specific color and belongs to exactly one Zone.
5. **Stations (Milestones):** 
   The nodes on a line. Stations must have a date and a **Type**:
   * **Existing:** A standard point representing the status quo.
   * **Start:** The beginning of a new initiative.
   * **Milestone:** A standard measurable goal.
   * **Transfer:** A point where a migration happens. Selecting a "Transfer To" target automatically connects two stations and bends the visual lines toward each other.
   * **Terminus:** The end of a line (e.g., software deprecation).
6. **Station Properties:**
   * **Tint Line:** Fades out the line color after this station (useful for deprecation phases).
   * **Is Stop:** Renders as a small tick mark instead of a full circle.
   * **Flip Label:** Forces the text label to render on the opposite side of the line.
   * **Description:** A Markdown-enabled text field that appears in tooltips and the Text/Markdown view.
   * **Relations:** Establish logical links (`dependsOn` / `synchronizedWith`) to any other station on the map.

---

## 🛠️ Tech Stack & Dependencies

MetroViz is built as a modern, lightweight, serverless Single Page Application (SPA). It uses vanilla ES6 modules and relies on external libraries loaded via CDN:

* **Architecture:** HTML5, CSS3, Vanilla JS (ES6 Modules)
* **Reactivity & State:** [Alpine.js](https://alpinejs.dev/)
* **Visualization:** [D3.js (v7)](https://d3js.org/) for SVG rendering, math, and layout calculation.
* **Localization:** [i18next](https://www.i18next.com/) (along with HttpBackend and BrowserLanguageDetector).
* **URL Compression:** [lz-string](https://pieroxy.net/blog/pages/lz-string/index.html) for encoding JSON state into shareable links.
* **Markdown & Security:** [marked.js](https://marked.js.org/) for Markdown parsing and [DOMPurify](https://github.com/cure53/DOMPurify) for rigorous XSS protection and SVG sanitization.
* **PDF Export:** [jsPDF](https://github.com/parallax/jsPDF) and [svg2pdf.js](https://github.com/yWorks/svg2pdf.js).

---

## 🚀 How to Run Locally

Since MetroViz uses ES6 modules (`type="module"`), you cannot simply open the `index.html` file from your local filesystem using `file://`. You must serve it via a local web server.

1. Clone this repository.
2. Open your terminal and navigate to the project directory.
3. Start a local server. For example, using Python:
   ```bash
   python3 -m http.server 8000
   ```
4. Open your browser and navigate to `http://localhost:8000`.

---

## 📦 Export Options Explained

MetroViz provides several ways to extract your data via the "Export" menu:

* **SVG Map:** Exports the exact visual state of the Metro Map as a scalable vector graphic. (Sanitized for security).
* **PNG Map:** Renders the SVG onto a high-resolution Canvas and exports a standard image file.
* **PDF Map:** Converts the SVG into a vector-based PDF document perfectly sized to the map's dimensions.
* **JSON:** Exports the raw JSON data model. This file can be imported back into MetroViz on another device.
* **Markdown:** Exports the currently active "Text Version" of the roadmap, cleanly formatted with Markdown headers, lists, links, and descriptions.

---

## 🌍 Contributing: How to Add a New Language

MetroViz supports internationalization (i18n). The UI, the Markdown export, and map labels (like "Today") adapt dynamically. 

We welcome Pull Requests (PRs) for new languages! Here is how you can add one:

1. **Create the translation file:**
   Navigate to the `locales/` folder. Duplicate the `en` folder and rename it to your target language code (e.g., `fr` for French, `es` for Spanish).
   ```
   locales/
     ├── de/
     │    └── translation.json
     ├── en/
     │    └── translation.json
     └── fr/
          └── translation.json   <-- Your new file
   ```
2. **Translate the strings:**
   Open your new `translation.json` and translate the values on the right side of the JSON key-value pairs. *Do not change the keys on the left.*
3. **Update the UI Dropdown:**
   Open `index.html`, find the language `<select>` element (around line 110), and add your language option:
   ```html
   <select x-data ...>
       <option value="de">DE</option>
       <option value="en">EN</option>
       <option value="fr">FR</option> <!-- Your new option -->
   </select>
   ```
4. **Test locally & Submit a PR:**
   Run the app locally to ensure your language loads correctly when selected. Once verified, commit your changes and open a Pull Request on GitHub.

---

*Built with ❤️ for digital independence and better technical planning.*
