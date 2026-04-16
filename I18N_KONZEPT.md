# Konzept: Multilinguale GUI für MetroViz (i18n)

Dieses Konzept beschreibt den technischen und strukturellen Weg, um die Nutzeroberfläche (GUI) von MetroViz zweisprachig (Deutsch / Englisch) aufzustellen. Eingegebene Nutzerdaten (Stationsnamen, Beschreibungen, Zonen etc.) bleiben dabei strikt unangetastet und verbleiben in der vom Nutzer gewählten Sprache.

Das oberste Gebot bei der Umsetzung lautet **"robust und gut abgehangen"**. Daher wird auf die Industrie-Standard-Bibliothek `i18next` zurückgegriffen, anstatt eine eigene Lokalisierungslogik neu zu erfinden.

---

## 1. Technologiewahl
Wir verwenden das **i18next**-Ökosystem. Dies ist der etablierteste Standard für JavaScript-Übersetzungen und bietet von Haus aus exakt die benötigten Funktionen:
* **`i18next`**: Der Kern, der die Übersetzungslogik und Interpolationen übernimmt.
* **`i18next-http-backend`**: Ein Plugin, um Sprachdateien (`.json`) dynamisch asynchron zur Laufzeit vom Server/Dateisystem zu laden. Das hält den initialen Bundle-Footprint klein.
* **`i18next-browser-languagedetector`**: Erkennt automatisch die Sprache des Nutzers (Browsersprache) und speichert eine manuelle Sprachauswahl persistent im `localStorage` ab.

## 2. Struktur der Sprachdateien für GitHub-Contributions
Um zu ermöglichen, dass Nutzende auf GitHub auf einfachste Weise eigene Übersetzungen beisteuern können, werden die Übersetzungen in separate, simple JSON-Dateien ausgelagert.

**Geplante Verzeichnisstruktur:**
```text
locales/
  ├── de/
  │    └── translation.json
  └── en/
       └── translation.json
```

**Beispiel `locales/de/translation.json`:**
```json
{
  "header": {
    "editToggle": "Edit",
    "viewMap": "Metro-Map",
    "viewMarkdown": "Textfassung",
    "save": "Speichern",
    "copy": "Kopieren",
    "new": "Neu",
    "cleanup": "Aufräumen",
    "import": "Import",
    "share": "Teilen",
    "export": "Export"
  },
  "editor": {
    "metaTitle": "Metadaten",
    "eventsTitle": "Events (Deadlines, Termine)"
  }
}
```
Ein neuer Contributor müsste auf GitHub für eine weitere Sprache (z. B. Spanisch) lediglich einen Ordner `es/` anlegen, die JSON-Datei kopieren, übersetzen und per Pull Request einreichen.

## 3. Integration in Alpine.js
Da die App stark auf Alpine.js aufbaut, muss die Übersetzungslogik "reaktiv" sein. Wenn der Nutzer die Sprache umschaltet, müssen sich alle Texte sofort im DOM anpassen, ohne dass die Seite neu geladen wird.

Das lässt sich robust über einen globalen **Alpine Store** lösen:

```javascript
// Initiale Konfiguration von i18next vor/während Alpine startet
await i18next
    .use(i18nextHttpBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
        fallbackLng: 'de',
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json'
        }
    });

document.addEventListener('alpine:init', () => {
    // Zentraler Store für Übersetzungen
    Alpine.store('i18n', {
        // Reaktiver State: wird bei Änderung das Re-Rendern aller gebundenen Texte auslösen
        locale: i18next.resolvedLanguage, 

        // Die t-Funktion für das HTML
        t(key) {
            // Durch das Lesen von this.locale merkt sich Alpine hier die Abhängigkeit
            const trigger = this.locale; 
            return i18next.t(key);
        },

        // Funktion für den Sprachumschalter
        async changeLanguage(lang) {
            await i18next.changeLanguage(lang);
            this.locale = i18next.resolvedLanguage;
            document.documentElement.lang = this.locale; // Accessibility
        }
    });
});
```

## 4. Anpassungen in der HTML-Datei (`index.html`)

### 4.1 Laden der Bibliotheken
Im `<head>` oder vor den Hauptskripten werden die i18next-Module via CDN eingebunden (analog zu D3 und Alpine):
```html
<script src="https://cdn.jsdelivr.net/npm/i18next@23/i18next.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/i18next-http-backend@2/i18nextHttpBackend.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@7/i18nextBrowserLanguageDetector.min.js"></script>
```

### 4.2 Einbau des Sprachumschalters
Im `<header>` wird direkt neben den bestehenden Controls ein einfaches Dropdown oder Toggle platziert:

```html
<div class="lang-switcher">
    <select 
        x-data 
        :value="$store.i18n.locale.split('-')[0]" 
        @change="$store.i18n.changeLanguage($event.target.value)">
        <option value="de">DE</option>
        <option value="en">EN</option>
    </select>
</div>
```

### 4.3 Austauschen der statischen Strings
Die hartcodierten deutschen Texte im HTML werden durch Aufrufe der `$store.i18n.t()` Methode ersetzt. **Nutzerdaten (`data.meta.title` etc.) bleiben bewusst wie sie sind.**

*Vorher:*
```html
<button @click="saveFile()" title="Speichern">
    <svg>...</svg>
    <span>Speichern</span>
</button>
```

*Nachher:*
```html
<button @click="saveFile()" :title="$store.i18n.t('header.save')">
    <svg>...</svg>
    <span x-text="$store.i18n.t('header.save')"></span>
</button>
```

## 5. Umgang mit serverseitigen Fehlernmeldungen / JS-Alerts
Für Strings, die tief in der Logik stecken (z.B. in `js/file-manager.js` wie `dialogAlert('Fehler beim Speichern...')`), wird `i18next.t('errors.saveFailed')` programmatisch im JavaScript-Code aufgerufen. Da der JS-Code die Logik steuert, ist dort keine Alpine-Reaktivität nötig; die Meldung wird einfach im Moment des Auftretens in der aktuellen Sprache erzeugt.

## 6. Zusammenfassung der Aufwände
1. **Bibliotheken einbinden:** CDN-Links in `index.html` hinzufügen.
2. **Ordnerstruktur anlegen:** `locales/de/translation.json` und `locales/en/translation.json` anlegen.
3. **Strings auslagern:** Alle statischen UI-Strings aus dem HTML in die DE-JSON kopieren.
4. **Übersetzen:** Die DE-JSON ins Englische übersetzen.
5. **Logik implementieren:** Den `i18next` Setup-Code und den `Alpine.store` in die `js/app.js` (oder eine neue `js/i18n.js`) einfügen.
6. **HTML refactoren:** Alle `<span x-text="...">` an den Alpine Store anbinden.

Durch diese Herangehensweise wird das Rad nicht neu erfunden. Es greift auf Best Practices zurück, ist extrem wartbar und verhält sich 100% kompatibel zu Alpine.js.
