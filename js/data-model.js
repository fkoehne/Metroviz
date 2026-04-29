import { parseDate } from './utils.js';

/**
 * Kümmert sich um das Abrufen, die Validierung und Normalisierung von Metro-Map-Daten.
 */
export class DataModel {
    constructor() {}

    async loadFromUrl(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return this.validateAndNormalize(data);
    }

    /**
     * Validiert rohe JSON-Daten und normalisiert Datumsangaben in sortierbare Date-Objekte.
     * @param {Object} data - Die rohe JSON-Konfiguration für die Metro-Map.
     * @returns {Object} Ein normalisiertes Datenobjekt mit geparsten Datumsangaben und sortierten Arrays.
     */
    validateAndNormalize(data) {
        // Minimal validation
        // Intent: Fail early if core structure is missing to prevent complex errors downstream.
        if (!data.timeline || !data.zones || !data.lines) {
            throw new Error('Invalid data format: missing required fields');
        }

        if (!Array.isArray(data.zones)) throw new Error('Invalid data format: zones must be an array');
        if (!Array.isArray(data.lines)) throw new Error('Invalid data format: lines must be an array');
        if (data.events && !Array.isArray(data.events)) throw new Error('Invalid data format: events must be an array');

        const validStationTypes = ['start', 'milestone', 'transfer', 'terminus', 'existing', 'normal', 'interchange', 'terminal'];

        const normalizedData = {
            meta: data.meta || {},
            timeline: {
                start: parseDate(data.timeline.start, 'throw'),
                end: parseDate(data.timeline.end, 'throw')
            },
            events: (data.events || []).map(e => ({
                ...e,
                dateObj: parseDate(e.date, 'throw')
            })).sort((a, b) => a.dateObj - b.dateObj),
            zones: data.zones.map(z => ({ ...z })),
            lines: data.lines.map(line => {
                const normalizedLine = { ...line };
                normalizedLine.stations = (line.stations || []).map(station => {
                    if (station.type && !validStationTypes.includes(station.type)) {
                        throw new Error(`Invalid station type: ${station.type}`);
                    }
                    return {
                        ...station,
                        dateObj: parseDate(station.date, 'throw'),
                        lineId: line.id
                    };
                }).sort((a, b) => a.dateObj - b.dateObj);
                return normalizedLine;
            })
        };

        return normalizedData;
    }
}