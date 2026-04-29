import { parseDate } from './utils.js';

export const editorActions = {
    // Intent: Array-Mutationen (wie .push() und .splice()) werden in diesem Objekt extensiv genutzt.
    // Dies tun wir, um das Reaktivitätssystem des zugrunde liegenden UI-Frameworks (z. B. Alpine.js) auszulösen,
    // welches direkte Array-Änderungen überwacht, um die Ansicht zu aktualisieren, anstatt sich auf Immutabilität zu verlassen.

    /**
     * Generiert einen zufälligen alphanumerischen ID-String.
     * @param {string} prefix - Das Präfix für die generierte ID.
     * @returns {string} Die zufällige ID mit Präfix.
     */
    generateId(prefix) {
        return prefix + '-' + Math.random().toString(36).substr(2, 6);
    },

    /**
     * Vergleicht zwei HEX-Farbstrings sicher.
     * @param {string} a - Erste Farbe.
     * @param {string} b - Zweite Farbe.
     * @returns {boolean} True, wenn die Farben übereinstimmen.
     */
    paletteColorsEqual(a, b) {
        if (a == null || b == null) return false;
        return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    },

    /**
     * Prüft, ob eine benutzerdefinierte HEX-Farbe in der vordefinierten Metro-Palette existiert.
     * @param {string} hex - Die zu prüfende Farbe.
     * @returns {boolean} True, wenn die Farbe Teil der Palette ist.
     */
    colorInMetroPalette(hex) {
        return this.metroPalette.some((c) => this.paletteColorsEqual(c, hex));
    },

    /**
     * Stellt sicher, dass ein Editor-Element sichtbar ist, indem zum Visual-Tab gewechselt wird,
     * die übergeordnete Linie/Zone aufgeklappt und weich dorthin gescrollt wird.
     * 
     * @param {string} domId - Die DOM-ID des Elements, zu dem gescrollt werden soll.
     */
    scrollVisualEditorItemToView(domId) {
        this.activeTab = 'visual';
        this.$nextTick(() => {
            requestAnimationFrame(() => {
                const el = document.getElementById(domId);
                if (!el) return;
                const lineCard = el.closest('.line-card');
                if (lineCard) {
                    lineCard.dispatchEvent(new CustomEvent('expand-line'));
                }
                if (domId.startsWith('editor-zone-')) {
                    el.dispatchEvent(new CustomEvent('expand-zone'));
                }
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 50);
            });
        });
    },

    /**
     * Fügt ein neues globales Event/eine Deadline zum Datenmodell hinzu.
     */
    addEvent() {
        if (!this.data.events) this.data.events = [];
        const id = this.generateId('event');
        this.data.events.push({
            id,
            label: 'Neues Event',
            date: this.data.timeline.start || '2025-Q1'
        });
        this.scrollVisualEditorItemToView('editor-event-' + id);
    },

    /**
     * Entfernt ein Event an einem bestimmten Index.
     * @param {number} index - Event-Array-Index.
     */
    removeEvent(index) {
        // Direct mutation (splice) is intentional here so the reactivity system 
        // picks up the array change and updates the DOM automatically.
        this.data.events.splice(index, 1);
    },

    /**
     * Appends a new zone/topic area to the data model.
     */
    addZone() {
        const id = this.generateId('zone');
        this.data.zones.push({
            id,
            label: 'Neue Zone',
            color: '#cccccc'
        });
        this.scrollVisualEditorItemToView('editor-zone-' + id);
    },

    /**
     * Entfernt eine Zone aus dem Datenmodell und weist deren Linien einer benachbarten Zone zu.
     * Linien der gelöschten Zone werden in die vorherige Zone verschoben, falls vorhanden,
     * ansonsten in die nachfolgende Zone. Gibt es keine weitere Zone, bleibt die Zonenzuordnung leer.
     * @param {number} index - Zone-Array-Index.
     */
    removeZone(index) {
        const removedZoneId = this.data.zones[index].id;

        let replacementZoneId = '';
        if (this.data.zones.length > 1) {
            const replacementIndex = index > 0 ? index - 1 : index + 1;
            replacementZoneId = this.data.zones[replacementIndex].id;
        }

        this.data.lines.forEach(line => {
            if (line.zone === removedZoneId) {
                line.zone = replacementZoneId;
            }
        });

        this.data.zones.splice(index, 1);
    },

    /**
     * Shifts a zone upwards in the order/rendering hierarchy.
     * @param {number} index - Zone array index.
     */
    moveZoneUp(index) {
        if (index > 0) {
            const temp = this.data.zones[index];
            this.data.zones[index] = this.data.zones[index - 1];
            this.data.zones[index - 1] = temp;
        }
    },

    /**
     * Shifts a zone downwards in the order/rendering hierarchy.
     * @param {number} index - Zone array index.
     */
    moveZoneDown(index) {
        if (index < this.data.zones.length - 1) {
            const temp = this.data.zones[index];
            this.data.zones[index] = this.data.zones[index + 1];
            this.data.zones[index + 1] = temp;
        }
    },

    /**
     * Appends a new line (technology) inside the currently first zone.
     */
    addLine() {
        const zoneId = this.data.zones.length > 0 ? this.data.zones[0].id : '';
        const id = this.generateId('line');
        this.data.lines.push({
            id,
            label: 'Neue Linie',
            color: '#0078D4',
            zone: zoneId,
            stations: []
        });
        this.scrollVisualEditorItemToView('editor-line-' + id);
    },

    /**
     * Entfernt eine Linie aus dem Datenmodell und bereinigt Verweise auf deren Stationen.
     * @param {number} index - Linien-Array-Index.
     */
    removeLine(index) {
        const line = this.data.lines[index];
        const removedStationIds = new Set((line.stations || []).map(station => station.id));

        this.data.lines.forEach((otherLine, lineIndex) => {
            if (lineIndex === index) return;
            (otherLine.stations || []).forEach(station => {
                if (removedStationIds.has(station.transferTo)) {
                    delete station.transferTo;
                    if (station.type === 'transfer') station.type = 'milestone';
                }
                if (removedStationIds.has(station.transferFrom)) {
                    delete station.transferFrom;
                }
                if (Array.isArray(station.relations)) {
                    station.relations = station.relations.filter(rel => !removedStationIds.has(rel?.target));
                    if (station.relations.length === 0) delete station.relations;
                }
            });
        });

        this.data.lines.splice(index, 1);
    },

    /**
     * Moves a line up, swapping its position with the line above it within the same zone.
     * @param {number} index - Index of the line to shift up.
     */
    moveLineUp(index) {
        const line = this.data.lines[index];
        let prevIndex = -1;
        for (let i = index - 1; i >= 0; i--) {
            if (this.data.lines[i].zone === line.zone) {
                prevIndex = i;
                break;
            }
        }
        if (prevIndex !== -1) {
            const temp = this.data.lines[index];
            this.data.lines[index] = this.data.lines[prevIndex];
            this.data.lines[prevIndex] = temp;
        }
    },

    /**
     * Moves a line down, swapping its position with the line below it within the same zone.
     * @param {number} index - Index of the line to shift down.
     */
    moveLineDown(index) {
        const line = this.data.lines[index];
        let nextIndex = -1;
        for (let i = index + 1; i < this.data.lines.length; i++) {
            if (this.data.lines[i].zone === line.zone) {
                nextIndex = i;
                break;
            }
        }
        if (nextIndex !== -1) {
            const temp = this.data.lines[index];
            this.data.lines[index] = this.data.lines[nextIndex];
            this.data.lines[nextIndex] = temp;
        }
    },

    /**
     * Checks if a line can be shifted upwards inside its zone.
     * @param {number} index - Line array index.
     * @returns {boolean} True if the line can be shifted.
     */
    canMoveLineUp(index) {
        const line = this.data.lines[index];
        for (let i = index - 1; i >= 0; i--) {
            if (this.data.lines[i].zone === line.zone) return true;
        }
        return false;
    },

    /**
     * Checks if a line can be shifted downwards inside its zone.
     * @param {number} index - Line array index.
     * @returns {boolean} True if the line can be shifted.
     */
    canMoveLineDown(index) {
        const line = this.data.lines[index];
        for (let i = index + 1; i < this.data.lines.length; i++) {
            if (this.data.lines[i].zone === line.zone) return true;
        }
        return false;
    },

    /**
     * Appends a new station/milestone to a specific line.
     * @param {Object} line - The line object to append the station to.
     */
    addStation(line) {
        if (!line.stations) line.stations = [];
        const id = this.generateId('station');
        line.stations.push({
            id,
            label: 'Neue Station',
            date: this.data.timeline.start || '2025-Q1',
            type: 'milestone'
        });
        this.scrollVisualEditorItemToView('editor-station-' + id);
    },

    /**
     * Removes a station from a line. Also cleans up any transfer connections pointing to it.
     * @param {Object} line - The parent line object.
     * @param {number} index - Station array index within the line.
     */
    removeStation(line, index) {
        const station = line.stations[index];
        if (station) {
            this.data.lines.forEach(l => {
                (l.stations || []).forEach(s => {
                    if (s.transferTo === station.id) {
                        delete s.transferTo;
                        if (s.type === 'transfer') s.type = 'milestone';
                    }
                });
            });
        }
        line.stations.splice(index, 1);
    },

    /**
     * Appends an empty relationship record (dependsOn / synchronizedWith) to a station.
     * @param {Object} station - The source station.
     */
    addStationRelation(station) {
        if (!station.relations) station.relations = [];
        station.relations.push({ kind: 'dependsOn', target: '', label: '' });
    },

    /**
     * Removes a relationship record from a station.
     * @param {Object} station - The source station.
     * @param {number} index - Relationship array index.
     */
    removeStationRelation(station, index) {
        if (!station.relations) return;
        station.relations.splice(index, 1);
        if (station.relations.length === 0) delete station.relations;
    },

    /**
     * Sortiert Events und Stationen chronologisch und bereinigt fehlerhafte Referenzen.
     * 
     * Intent: Über die Zeit können Benutzer Stationen oder Linien löschen, die von anderen Stationen referenziert werden 
     * (z. B. Transfers oder Abhängigkeiten). Diese Funktion stellt die referenzielle Integrität sicher, 
     * indem sie "hängende" Zeiger auf nicht existierende IDs entfernt.
     */
    resortAndClean() {
        // Sort events chronologically
        if (this.data.events) {
            this.data.events.sort((a, b) => parseDate(a.date, 'now') - parseDate(b.date, 'now'));
        }

        // Build a set of all valid station IDs to check references against
        const validStationIds = new Set();
        this.data.lines.forEach(line => {
            if (line.stations) {
                line.stations.forEach(s => validStationIds.add(s.id));
            }
        });

        // Clean and sort stations
        this.data.lines.forEach(line => {
            if (line.stations) {
                // Sort stations chronologically by date
                line.stations.sort((a, b) => parseDate(a.date, 'now') - parseDate(b.date, 'now'));
                
                // Clean up transfer and relation references
                line.stations.forEach(station => {
                    // Only transfer or terminus stations should have a transferTo property
                    if (!['transfer', 'terminus'].includes(station.type)) {
                        delete station.transferTo;
                    }
                    // Remove transferTo if the target station no longer exists
                    if (station.transferTo && !validStationIds.has(station.transferTo)) {
                        delete station.transferTo;
                        if (station.type === 'transfer') {
                            station.type = 'milestone';
                        }
                    }
                    
                    // Clean up transferFrom (legacy/alternative property)
                    if (!['transfer', 'start'].includes(station.type)) {
                        delete station.transferFrom;
                    }
                    if (station.transferFrom && !validStationIds.has(station.transferFrom)) {
                        delete station.transferFrom;
                    }

                    if (Array.isArray(station.relations)) {
                        station.relations = station.relations.filter((rel) => {
                            if (!rel || !rel.target) return false;
                            if (!['dependsOn', 'synchronizedWith'].includes(rel.kind)) return false;
                            return validStationIds.has(rel.target);
                        });
                        const seenSync = new Set();
                        station.relations = station.relations.filter((rel) => {
                            if (rel.kind !== 'synchronizedWith') return true;
                            const a = station.id < rel.target ? station.id : rel.target;
                            const b = station.id < rel.target ? rel.target : station.id;
                            const k = `${a}:${b}`;
                            if (seenSync.has(k)) return false;
                            seenSync.add(k);
                            return true;
                        });
                        if (station.relations.length === 0) delete station.relations;
                    }
                });
            }
        });
    },

    /**
     * Fokussiert auf eine spezifische Station, indem deren Zone/Linie aufgeklappt und hervorgehoben wird.
     * 
     * @param {string} stationId - Die ID der zu fokussierenden Station.
     */
    focusStation(stationId) {
        this.editorVisible = true;
        this.activeTab = 'visual'; 
        
        let targetLineIndex = -1;
        let targetZoneIndex = -1;
        
        for (let z = 0; z < this.data.zones.length; z++) {
            const zoneLines = this.data.lines.filter(l => l.zone === this.data.zones[z].id);
            for (let l = 0; l < this.data.lines.length; l++) {
                if (this.data.lines[l].stations && this.data.lines[l].stations.some(s => s.id === stationId)) {
                    targetLineIndex = l;
                    targetZoneIndex = this.data.zones.findIndex(zone => zone.id === this.data.lines[l].zone);
                    break;
                }
            }
            if (targetLineIndex !== -1) break;
        }

        if (targetZoneIndex !== -1) this.data.zones[targetZoneIndex].collapsed = false;
        
        this.$nextTick(() => { 
            const el = document.getElementById('editor-station-' + stationId); 
            if(el) { 
                const lineCard = el.closest('.line-card');
                if (lineCard) {
                    // Need to dispatch a custom event to the specific line card because of isolated x-data
                    lineCard.dispatchEvent(new CustomEvent('expand-line'));
                }
                
                setTimeout(() => {
                    el.scrollIntoView({behavior: 'smooth', block: 'center'}); 
                    el.style.transition = 'background-color 0.5s'; 
                    const oldBg = el.style.backgroundColor; 
                    el.style.backgroundColor = '#444'; 
                    setTimeout(() => el.style.backgroundColor = oldBg, 1000);
                }, 50);
            } 
        });
    },

    /**
     * Sammelt alle Stationen der gesamten Map, überspringt diejenige, die ausgeschlossen werden soll.
     * Nützlich zum Aufbauen von Dropdowns für Transfers oder Beziehungen.
     * @param {string} excludeId - ID der Station, die in den Ergebnissen weggelassen werden soll.
     * @returns {Array} Liste von Stationsobjekten mit kurzen Label-Infos.
     */
    getAllStations(excludeId) {
        const all = [];
        this.data.lines.forEach(line => {
            (line.stations || []).forEach(station => {
                if (station.id !== excludeId) {
                    all.push({
                        id: station.id,
                        label: station.label,
                        lineLabel: line.label
                    });
                }
            });
        });
        return all;
    },

    /**
     * Findet und liefert ein Stationsobjekt über dessen eindeutige ID aus der gesamten Map.
     * @param {string} id - Die eindeutige ID der zu lokalisierenden Station.
     * @returns {Object|null} Das Stationsobjekt oder null, falls nicht gefunden.
     */
    getStationById(id) {
        for (const line of this.data.lines) {
            if (line.stations) {
                const s = line.stations.find(st => st.id === id);
                if (s) return s;
            }
        }
        return null;
    },

    /**
     * Behandelt Typ-Änderungen im Stations-Editor.
     * Wenn eine Station von Transfer/Ende zu etwas anderem wechselt, werden vorher verknüpfte Transfer-Ziele entkoppelt.
     * @param {Object} station - Die Station, die geändert wird.
     */
    handleTypeChange(station) {
        if (!['transfer', 'terminus'].includes(station.type)) {
            if (station.transferTo) {
                const oldTargetId = station.transferTo;
                delete station.transferTo;
                
                const target = this.getStationById(oldTargetId);
                if (target && target.transferTo === station.id) {
                    delete target.transferTo;
                    if (target.type === 'transfer') {
                        target.type = 'milestone';
                    }
                }
            }
        }
    },

    /**
     * Verwaltet bidirektionale Verbindungen für Transfer-Stationen.
     * Wenn Station A mit B verbindet, wird B automatisch wieder mit A verbunden und die Typen werden aktualisiert.
     * @param {Object} station - Die Station, deren Transferziel geändert wurde.
     */
    handleTransferChange(station) {
        if (!station.transferTo) {
            delete station.transferTo;
        } else {
            const target = this.getStationById(station.transferTo);
            if (target) {
                // If the target previously pointed to something else, unlink it
                if (target.transferTo && target.transferTo !== station.id) {
                    const oldOther = this.getStationById(target.transferTo);
                    if (oldOther && oldOther.transferTo === target.id) {
                        delete oldOther.transferTo;
                        if (oldOther.type === 'transfer') oldOther.type = 'milestone';
                    }
                }
                
                // Force target to be transfer if it isn't terminus
                if (target.type !== 'terminus') {
                    target.type = 'transfer';
                }
                target.transferTo = station.id;
            }
        }

        // Clean up any other stations that previously pointed to 'station' but shouldn't anymore
        this.data.lines.forEach(line => {
            (line.stations || []).forEach(s => {
                if (s.transferTo === station.id && s.id !== station.transferTo) {
                    delete s.transferTo;
                    if (s.type === 'transfer') s.type = 'milestone';
                }
            });
        });
    }
};
