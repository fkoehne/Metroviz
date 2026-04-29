# Projektdokumentation

## 1. Technische Dokumentation

**Zweck und Aufbau des Projekts**
MetroViz ist eine interaktive, rein clientseitig laufende Webanwendung (Single Page Application), mit der Technologie-Roadmaps, Projektpläne und Migrationen im visuellen Stil eines U-Bahn-Plans ("Metro Map") erstellt, bearbeitet und geteilt werden können.

**Architekturüberblick**
Die Anwendung verfolgt eine serverless Architektur und arbeitet komplett im Browser. Daten werden im lokalen Speicher des Browsers (`localStorage`) vorgehalten oder für das Teilen (Sharing) komprimiert an die URL angehängt. Die fachliche Logik ist in modularem JavaScript aufgeteilt (Modell, Layout, Rendering, Im-/Export).

**Verwendete Sprachen, Frameworks, Libraries und Tools**
- **Sprachen**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **Reaktivität & Zustand**: [Alpine.js](https://alpinejs.dev/)
- **Visualisierung**: [D3.js (v7)](https://d3js.org/) für SVG-Rendering und Layout-Mathematik
- **Internationalisierung**: [i18next](https://www.i18next.com/)
- **Kompression**: [lz-string](https://pieroxy.net/blog/pages/lz-string/index.html) (für URL-Zustände)
- **Markdown & Sicherheit**: [marked.js](https://marked.js.org/) und [DOMPurify](https://github.com/cure53/DOMPurify)
- **PDF-Export**: [jsPDF](https://github.com/parallax/jsPDF) und [svg2pdf.js](https://github.com/yWorks/svg2pdf.js)

**Abhängigkeiten**
- Sämtliche JavaScript-Bibliotheken werden zur Laufzeit extern via CDN (unpkg, cdnjs, jsdelivr) geladen.
- Es gibt keine serverseitigen Build-, Laufzeit- oder Entwicklungsabhängigkeiten (wie Node.js oder Webpack).

**Ordnerstruktur**
- `/css/`: Stylesheets (`metroviz.css`).
- `/data/`: Beispiel-Datenmodelle (z. B. `example.json`).
- `/js/`: Die eigentliche App-Logik, aufgeteilt in Module (z. B. `app.js`, `metro-renderer.js`, `layout-engine.js`).
- `/locales/`: Übersetzungsdateien für i18n (`de/`, `en/`).

**Konfigurationsmechanismen**
Es gibt keine serverseitigen Umgebungsvariablen. Die Konfiguration erfolgt über die `index.html` (z. B. Matomo Tracking-Code) und über URL-Parameter (`lang`, `editor`, `view`, `zstate`, `data`). Das eigentliche Domänenmodell wird als JSON-Struktur gepflegt.

**Externe Dienste, APIs, Datenbanken oder Integrationen**
- Eine Matomo-Tracking-Instanz (`matomo.wolkenbar.de`) ist in `index.html` integriert.
- Ansonsten nutzt das System keine externen APIs oder Datenbanken.

**Teststrategie**
Es gibt im Repository keine erkennbare automatisierte Testinfrastruktur (wie Jest, Mocha etc.). Lediglich eine `test.json` ist vorhanden, die vermutlich für manuelle Tests der JSON-Ladefunktion gedacht ist.

**Wichtige technische Annahmen oder Grenzen**
- Die Anwendung kann wegen der CORS-Beschränkungen auf ES6-Module nicht direkt über das Dateisystem (`file://`) aufgerufen werden.
- Komplexe Roadmaps in der URL (`?data=...`) können sehr lang werden, wodurch technische Limits von Browsern, Messengern oder Servern bezüglich der URL-Länge erreicht werden können.
- Beim Import von externen JSON-Dateien per URL müssen CORS-Richtlinien auf dem Zielserver den Abruf zulassen.

---

## 2. Anwenderdokumentation

**Ziel und Nutzen der Anwendung aus Anwendersicht**
Mit MetroViz können Anwender komplexe zeitliche Abhängigkeiten und Strategien optisch ansprechend und verständlich darstellen. Es hilft dabei, den Überblick über Meilensteine, Technologiewechsel und parallel laufende Arbeitsströme zu behalten.

**Beschreibung aller erkennbaren Features**
- **Dualer Modus**: Anzeige der Roadmap wahlweise als U-Bahn-Plan ("Metro-Map") oder als strukturiertes Textdokument ("Textfassung", Markdown).
- **Integrierter Editor**: Ein grafischer Editor für Meta-Informationen, Zonen, Linien und Stationen sowie ein direkter JSON-Editor für Power-User.
- **Export**: Herunterladen der Karte als SVG, PNG, PDF oder der Daten als JSON und Markdown.
- **Lokales Speichern**: Mehrere Roadmaps können unter verschiedenen Namen im Browser (`localStorage`) gesichert werden.
- **Teilen (Share)**: Generierung eines Links, der sämtliche Daten komprimiert enthält, um die Roadmap ohne Backend an andere Personen zu senden.
- **Internationalisierung**: Wechsel zwischen Deutsch und Englisch möglich.
- **Import**: Hochladen oder per Drag-and-Drop Einfügen von JSON-Dateien sowie der Import von externen URLs.

**Typische User-Flows bzw. Nutzungsszenarien**
1. **Erstellen**: Klick auf "Neu" > Eingabe von Meta-Daten (Start/Ende) > Anlegen von Zonen > Anlegen von Linien in diesen Zonen > Hinzufügen von Stationen (Meilensteinen) mit Datum.
2. **Abhängigkeiten definieren**: Stationen als "Transfer" markieren oder explizite Beziehungen ("Abhängig von", "Zeitgleich mit") pflegen.
3. **Dokumentieren**: Klick auf "Speichern" (sichert lokal) oder "Teilen" (Kopiert langen Link für E-Mail oder Chat).

**Eingaben, Ausgaben und Interaktionen**
- **Eingaben**: Formularfelder für Titel, Daten, Typen von Stationen (Start, Meilenstein, Transfer, Ende), Beschreibungstexte, Relationen.
- **Ausgaben**: Interaktive Karte (Tooltips bei Hover über Stationen, Hervorhebung von Linien) oder generierte Textansicht.
- **Interaktionen**: Linien und Zonen lassen sich auf- und zuklappen (Collapse).

**Rollen oder Berechtigungen**
Keine. Es handelt sich um eine Single-User-Anwendung ohne Login. Alle Daten verbleiben auf dem Endgerät des Anwenders.

**Wichtige Hinweise zur Bedienung**
- Geänderte Daten sind weg, wenn sie nicht per "Speichern" oder "Export als JSON" gesichert werden, da es kein automatisches Speichern in die Cloud gibt.
- Der geteilte Link ("Share") beinhaltet alle Daten. Er wird bei umfangreichen Projekten entsprechend lang. Es handelt sich hierbei de facto um das Speichermedium beim Versand.

**Bekannte funktionale Grenzen**
- Lokales Speichern gilt nur für denselben Browser auf demselben Rechner. Für geräteübergreifendes Arbeiten muss ein JSON-Export/Import oder der "Teilen"-Link genutzt werden.
- Externe Bilder können nicht im Tool hochgeladen werden, Text-Beschreibungen nutzen reines Markdown.

---

## 3. Betriebsdokumentation

**Voraussetzungen für Betrieb und Deployment**
Zum Betrieb wird lediglich ein statischer Webserver benötigt, der HTML, CSS und JavaScript-Dateien ausliefert.

**Benötigte Laufzeitumgebungen**
Keine serverseitigen Laufzeitumgebungen (wie PHP, Python, Node.js) nötig. Ein Standard-Webserver (Apache, Nginx, GitHub Pages, Vercel, Netlify) reicht völlig aus.

**Build- und Startprozesse**
- Es gibt keinen Build-Prozess. Die Quelldateien aus dem Repository können ohne Modifikation direkt per Webserver ausgeliefert werden.
- Lokaler Entwicklungsstart z. B. via `python3 -m http.server 8000` im Root-Verzeichnis.

**Umgebungsvariablen und Konfiguration**
Keine Umgebungsvariablen nötig.

**Datenbank- oder Infrastrukturabhängigkeiten**
Keine Datenbank erforderlich. Alle Zustandshaltung geschieht im Browser des Nutzers.

**Deployment-Optionen**
Das Repo ist aktuell auf GitHub Pages ausgelegt, kann aber auf jedem beliebigen statischen File-Hoster oder in S3-Buckets deployt werden.

**Hinweise zu Hosting, Reverse Proxy, Ports, Secrets, Persistenz, Logging, Monitoring, Health Checks, Backups oder Skalierung**
- **Persistenz/Backups**: Gibt es nicht auf Serverseite. Jeder Nutzer ist für Backups (per JSON-Export) seiner lokalen Daten selbst verantwortlich.
- **Secrets**: Es gibt keine API-Keys oder Secrets, da keine serverseitigen APIs genutzt werden.
- **Reverse Proxy**: Falls hinter einem Reverse Proxy betrieben, sind keine besonderen Weiterleitungen nötig. Standard-HTTP-Ports (80/443) reichen aus.
- **Skalierung**: Kann beliebig über CDNs skaliert werden, da es sich um rein statische Assets handelt und die App keine Serverlast (außer Auslieferung) erzeugt.

**Typische Stolperstellen beim Betrieb**
- **Dateisystem-Zugriff**: Wenn man die `index.html` direkt per Doppelklick im Browser öffnet (`file://...`), wird die App aufgrund der ES6 `type="module"`-Direktive in den `<script>`-Tags mit einem CORS-Fehler fehlschlagen. Sie muss stets von einem `http(s)://`-Protokoll ausgeliefert werden.

**Checkliste für Inbetriebnahme**
- [ ] Dateien auf den statischen Webserver oder CDN kopieren.
- [ ] Aufruf der URL prüfen (lädt die UI?).
- [ ] Bei Bedarf: Den Matomo-Tracking-Block in der `index.html` entfernen oder durch eigene Analytics ersetzen.
- [ ] Einmaliges Neuanlegen und Speichern einer Roadmap testen (prüfen, ob Local Storage Zugriff hat).
