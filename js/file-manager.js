import { downloadBlob, sanitizeSvg, sanitizeFilename } from './utils.js';

export const fileManagerActions = {
/**
     * Lädt den Index gespeicherter Dateien aus dem localStorage.
     */
    loadIndex() {
        try {
            const index = localStorage.getItem('metroviz_index');
            if (index) {
                this.savedFiles = JSON.parse(index);
            }
        } catch(e) { console.warn('loadIndex failed:', e); }
    },

/**
     * Speichert den aktuellen Datei-Index im localStorage.
     */
    saveIndex() {
        try {
            localStorage.setItem('metroviz_index', JSON.stringify(this.savedFiles));
        } catch (e) {
            console.error('Failed to save index:', e);
        }
    },

/**
     * Lädt eine spezifische Datei anhand ihres Namens aus dem localStorage.
     * @param {string} name - Der Name der zu ladenden Datei.
     */
    async loadFile(name) {
        if (!name) return;
        try {
            const dataStr = localStorage.getItem('metroviz_file_' + name);
            if (dataStr) {
                this.rawJson = dataStr;
                this.updateFromJson();
                this.currentFileName = name;
            }
        } catch (e) {
            await this.dialogAlert(i18next.t('js.loadFileError') + e.message, i18next.t('js.errorTitle'));
        }
    },

/**
     * Speichert die aktuellen Daten im localStorage unter dem aktuellen Dateinamen.
     * Fordert zur Eingabe eines neuen Namens auf, falls derzeit keine Datei ausgewählt ist.
     */
    async saveFile() {
        if (!this.currentFileName) {
            return await this.saveAsNew();
        }
        this.rawJson = JSON.stringify(this.data, null, 2);
        try {
            localStorage.setItem('metroviz_file_' + this.currentFileName, this.rawJson);
            await this.dialogAlert(i18next.t('js.savedSuccess').replace('{{name}}', this.currentFileName), i18next.t('js.savedTitle'));
        } catch (e) {
            console.error('Failed to save file:', e);
            await this.dialogAlert(i18next.t('js.saveError') + e.message, i18next.t('js.errorTitle'));
        }
    },

/**
     * Fordert den Benutzer zur Eingabe eines neuen Namens auf und speichert die aktuellen Daten als neue Datei.
     */
    async saveAsNew() {
        const name = await this.dialogPrompt(
            i18next.t('js.promptNewName'),
            i18next.t('js.defaultNewName'),
            i18next.t('js.defaultNewTitle')
        );
        if (name === null) return;
        const trimmed = (name || '').trim();
        if (!trimmed) return;
        if (this.savedFiles.includes(trimmed)) {
            const ok = await this.dialogConfirm(
                i18next.t('js.confirmOverwrite'),
                i18next.t('js.overwriteTitle')
            );
            if (!ok) return;
        } else {
            this.savedFiles.push(trimmed);
            this.saveIndex();
        }
        this.currentFileName = trimmed;
        await this.saveFile();
    },

/**
     * Erstellt eine neue, leere Roadmap mit Standard-Daten.
     */
    createNew() {
        const year = new Date().getFullYear();
        this.currentFileName = '';
        this.editorVisible = true;
        this.data = {
            meta: { title: i18next.t('js.defaultNewTitle'), organization: '' },
            timeline: { start: `${year}-Q1`, end: `${year + 1}-Q3` },
            events: [],
            zones: [],
            lines: []
        };
        this.rawJson = JSON.stringify(this.data, null, 2);
        this.renderMap(this.data);
    },

/**
     * Verarbeitet den Import von JSON-Daten aus einer ausgewählten oder per Drag-and-Drop abgelegten Datei.
     * Beinhaltet ein 5MB-Größenlimit als Sicherheitsprüfung.
     * @param {File} file - Das zu lesende Datei-Objekt.
     */
    importJsonFromFile(file) {
        if (!file) return;
        
        // Security check: Limit upload size to prevent DoS via excessively large files
        if (file.size > 5 * 1024 * 1024) { // 5 MB
            if (this.dialogAlert) {
                this.dialogAlert(i18next.t('js.importFileTooLarge'), i18next.t('js.errorTitle'));
            } else {
                alert(i18next.t('js.importFileTooLarge'));
            }
            return;
        }
        
        const reader = new FileReader();
        reader.onerror = (err) => console.error('FileReader error:', err);
        reader.onload = (e) => {
            this.rawJson = e.target.result;
            this.updateFromJson();
            this.currentFileName = '';
            this.importModalOpen = false;
        };
        reader.readAsText(file);
    },

/**
     * Verarbeitet das Dateieingabe-Änderungsereignis für den Import.
     * @param {Event} event - Das DOM-Änderungsereignis.
     */
    handleImportFileInput(event) {
        const file = event.target.files[0];
        if (file) this.importJsonFromFile(file);
        event.target.value = '';
    },

/**
     * Verarbeitet das Drag-and-Drop-Ereignis für den Import von JSON-Dateien.
     * @param {DragEvent} event - Das DOM-Drop-Ereignis.
     */
    importDropHandler(event) {
        event.preventDefault();
        this.importDropActive = false;
        const file = event.dataTransfer.files[0];
        if (file) this.importJsonFromFile(file);
    },

/**
     * Löst einen Import von der angegebenen URL aus.
     */
    async importFromUrl() {
        const url = this.importUrl.trim();
        if (!url) return;
        const ok = await this.loadFromRemoteSource(url);
        if (ok) {
            this.importModalOpen = false;
            this.importUrl = '';
        }
    },

/**
     * Lädt den Standard-Beispieldatensatz (data/example.json).
     */
    async loadInitialData() {
        try {
            const response = await fetch('data/example.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.rawJson = await response.text();
            this.updateFromJson();
        } catch (error) {
            console.error('Failed to initialize MetroViz:', error);
        }
    },

/**
     * Versucht, JSON-Daten von einer Remote-URL zu laden.
     * Verhindert XSS, prüft Protokoll, Timeouts und erzwingt Größenbeschränkungen.
     * @param {string} url - Die abzurufende externe JSON-URL.
     * @returns {boolean} True, wenn das Laden erfolgreich war, andernfalls false.
     */
    async loadFromRemoteSource(url) {
        this.jsonError = '';
        if (!url || typeof url !== 'string' || (!url.startsWith('https://') && !url.startsWith('http://'))) {
            this.jsonError = i18next.t('js.remoteLoadFailedPrefix');
            return false;
        }
        if (url.length > 2000) {
            this.jsonError = i18next.t('js.remoteLoadFailedTooLong');
            return false;
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) {
                this.jsonError = i18next.t('js.remoteLoadFailedHttp').replace('{{status}}', response.status);
                return false;
            }
            
            // Security check: Limit payload size to prevent DoS via remote URLs
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
                this.jsonError = i18next.t('js.remoteLoadFailedTooLarge');
                return false;
            }
            
            this.rawJson = await response.text();
            
            // Fallback check if content-length header was missing
            if (this.rawJson.length > 5 * 1024 * 1024) {
                this.jsonError = i18next.t('js.remoteLoadFailedContentTooLarge');
                this.rawJson = '';
                return false;
            }
            
            this.currentFileName = '';
            this.updateFromJson();
            return true;
        } catch (e) {
            this.jsonError = i18next.t('js.remoteLoadFailedOther') + (e.name === 'AbortError' ? i18next.t('js.remoteLoadFailedTimeout') : e.message);
            return false;
        }
    },

    /**
     * Serialisiert das aktuelle SVG-Element in eine Data-URL.
     * 
     * @returns {string|null} Die Data-URL des SVG, oder null, falls es fehlschlägt.
     */
    _getSvgDataUrl() {
        const svgElement = window.app.renderer.svgElement;
        if (!svgElement) return null;

        try {
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svgElement);
            
            // Workaround: Manually inject missing XML namespaces.
            // When serializing DOM nodes, default namespaces might be omitted by the browser,
            // which causes the resulting SVG file to be invalid when opened standalone.
            if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
                source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            }

            source = sanitizeSvg(source);

            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

            return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
        } catch (e) {
            console.error('Fehler beim SVG-Serialisieren:', e);
            return null;
        }
    },

    /**
     * Exportiert die aktuelle Roadmap-Ansicht als SVG-Datei.
     */
    exportSVG() {
        const svgUrl = this._getSvgDataUrl();
        if (!svgUrl) return;
        
        try {
            const source = decodeURIComponent(svgUrl.split(',')[1]);
            const filename = sanitizeFilename(this.currentFileName) + '.svg';
            downloadBlob(source, 'image/svg+xml;charset=utf-8;', filename);
        } catch (e) {
            console.error('Fehler beim SVG-Export:', e);
        }
    },

    /**
     * Exportiert die aktuelle Roadmap-Ansicht als hochauflösende PNG-Datei.
     */
    exportPNG() {
        const svgUrl = this._getSvgDataUrl();
        if (!svgUrl) return;
        const svgElement = window.app.renderer.svgElement;
        const width = svgElement.viewBox.baseVal.width;
        const height = svgElement.viewBox.baseVal.height;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 4; // High resolution
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                const filename = sanitizeFilename(this.currentFileName) + '.png';
                downloadBlob(blob, 'image/png', filename);
            }, 'image/png');
        };
        img.onerror = () => {
            console.error('Fehler beim Rendern des SVG für den PNG Export.');
            this.dialogAlert(i18next.t('js.pngExportError'), i18next.t('js.errorTitle'));
        };
        img.src = svgUrl;
    },

    /**
     * Exportiert die aktuelle Roadmap-Ansicht als PDF-Datei.
     * Erfordert, dass die Bibliotheken jsPDF und svg2pdf global geladen sind.
     */
    async exportPDF() {
        const svgElement = window.app.renderer.svgElement;
        if (!svgElement) return;
        
        const width = svgElement.viewBox.baseVal.width;
        const height = svgElement.viewBox.baseVal.height;

        if (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF && window.svg2pdf) {
            const pdf = new window.jspdf.jsPDF({
                orientation: width > height ? 'landscape' : 'portrait',
                unit: 'pt',
                format: [width, height]
            });
            
            try {
                await pdf.svg(svgElement, {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height
                });
                
                const filename = sanitizeFilename(this.currentFileName) + '.pdf';
                pdf.save(filename);
            } catch (err) {
                console.error("Fehler beim SVG-to-PDF Export:", err);
                this.dialogAlert(i18next.t('js.pdfExportError') + err.message, i18next.t('js.errorTitle'));
            }
        } else {
            console.error("jsPDF- oder svg2pdf-Bibliothek konnte nicht gefunden werden.");
            this.dialogAlert(i18next.t('js.pdfExportErrorLibs'), i18next.t('js.errorTitle'));
        }
    },

/**
     * Exportiert die rohe JSON-Repräsentation des aktuellen Roadmap-Zustands.
     */
    exportJSON() {
        if (!this.rawJson) return;
        const filename = sanitizeFilename(this.currentFileName) + '.json';
        downloadBlob(this.rawJson, 'application/json;charset=utf-8;', filename);
    }
};
