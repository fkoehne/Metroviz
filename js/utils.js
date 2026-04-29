/**
 * Maskiert HTML-Zeichen in einem String, um XSS-Angriffe bei der Injektion ins DOM zu verhindern.
 * 
 * @param {string} str - Der zu maskierende rohe String.
 * @returns {string} Der maskierte String.
 */
export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Bereinigt einen HTML-String mithilfe von DOMPurify, falls global verfügbar.
 * Dient als Fallback, wenn DOMPurify nicht geladen ist.
 * 
 * @param {string} html - Der zu bereinigende HTML-String.
 * @returns {string} Der bereinigte HTML-String.
 */
export function sanitizeHtml(html) {
    if (typeof window !== 'undefined' && window.DOMPurify) {
        return window.DOMPurify.sanitize(html);
    }
    // Minimal fallback if DOMPurify is not available
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '');
}

/**
 * Bereinigt einen SVG-String, um potenziell bösartige Elemente (wie <script> oder <foreignObject>)
 * vor dem Export zu entfernen, um sicherzustellen, dass heruntergeladene SVG-Dateien sicher sind.
 * 
 * @param {string} svgString - Der rohe SVG-String.
 * @returns {string} Der bereinigte SVG-String.
 */
export function sanitizeSvg(svgString) {
    if (typeof window !== 'undefined' && window.DOMPurify) {
        return window.DOMPurify.sanitize(svgString, {
            USE_PROFILES: { svg: true },
            ADD_ATTR: ['xmlns', 'xmlns:xlink']
        });
    }
    return svgString
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '');
}

/**
 * Bereinigt einen Dateinamen, um Path Traversal zu verhindern und potenziell gefährliche Zeichen zu entfernen.
 * 
 * @param {string} name - Der angeforderte Dateiname.
 * @param {string} fallback - Der Fallback-Name, falls der bereinigte Name leer ist.
 * @returns {string} Der bereinigte Dateiname.
 */
export function sanitizeFilename(name, fallback = 'metroviz-roadmap') {
    if (!name) return fallback;
    const safeName = name.replace(/[^a-zA-Z0-9_\-\säöüßÄÖÜ]/g, '_').trim();
    return safeName || fallback;
}

/**
 * Parst einen Datumsstring in ein Date-Objekt und unterstützt dabei sowohl Standard-ISO-Formate
 * als auch benutzerdefinierte quartalsbasierte Formate (z. B. "2023-Q1").
 * 
 * @param {string} dateStr - Der zu parsende Datumsstring.
 * @param {'null'|'throw'|'now'} [emptyBehavior='null'] - Wie mit leeren oder ungültigen Eingaben umgegangen wird.
 * @returns {Date|null} Das geparste Date-Objekt, oder null abhängig von emptyBehavior.
 */
export function parseDate(dateStr, emptyBehavior = 'null') {
    if (!dateStr) {
        if (emptyBehavior === 'throw') throw new Error('Invalid date: empty date string is not allowed');
        if (emptyBehavior === 'now') return new Date();
        return null;
    }
    
    // Support custom quarter-based dates (e.g., "2023-Q1") by converting the quarter to its first month
    if (dateStr.includes('-Q')) {
        const [year, q] = dateStr.split('-Q');
        const quarter = parseInt(q);
        if (emptyBehavior === 'throw' && (isNaN(quarter) || quarter < 1 || quarter > 4)) {
            throw new Error(`Invalid quarter format: ${dateStr}`);
        }
        const month = (quarter - 1) * 3; // Q1 -> Month 0 (Jan), Q2 -> Month 3 (Apr), etc.
        return new Date(year, month, 1);
    }
    
    // Robust parsing for strict YYYY-MM-DD (fixes issues in older Safari/iOS versions)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        return new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
    }
    
    const date = new Date(dateStr);
    if (emptyBehavior === 'throw' && isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}`);
    }
    return date;
}

/**
 * Löst einen Dateidownload im Browser aus, indem ein temporärer Anker-Link generiert wird.
 * 
 * @param {string|Blob|ArrayBuffer} content - Der herunterzuladende Inhalt.
 * @param {string} mime - Der MIME-Typ der Datei.
 * @param {string} filename - Der Ziel-Dateiname.
 */
export function downloadBlob(content, mime, filename) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    
    // Simulate a user click on an anchor element to trigger the browser's download prompt
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Cleanup the DOM and release the object URL to avoid memory leaks
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}
