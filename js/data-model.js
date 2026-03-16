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

    validateAndNormalize(data) {
        // Minimal validation
        if (!data.timeline || !data.zones || !data.lines) {
            throw new Error('Invalid data format: missing required fields');
        }

        // Parse dates to JavaScript Date objects
        const parseDate = (dateStr) => {
            if (!dateStr) return new Date(); // Fallback for empty dates
            // Very simple parser for "YYYY-QX" or "YYYY-MM-DD"
            if (dateStr.includes('-Q')) {
                const [year, q] = dateStr.split('-Q');
                const month = (parseInt(q) - 1) * 3;
                return new Date(year, month, 1);
            }
            return new Date(dateStr);
        };

        const normalizedData = {
            meta: data.meta || {},
            timeline: {
                start: parseDate(data.timeline.start),
                end: parseDate(data.timeline.end)
            },
            events: (data.events || []).map(e => ({
                ...e,
                dateObj: parseDate(e.date)
            })).sort((a, b) => a.dateObj - b.dateObj),
            zones: data.zones.map(z => ({ ...z })),
            lines: data.lines.map(line => {
                const normalizedLine = { ...line };
                normalizedLine.stations = (line.stations || []).map(station => ({
                    ...station,
                    dateObj: parseDate(station.date),
                    lineId: line.id
                })).sort((a, b) => a.dateObj - b.dateObj);
                return normalizedLine;
            })
        };

        return normalizedData;
    }
}