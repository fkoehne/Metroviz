/**
 * Calculates a bitmask representing the collapsed state of up to 31 zones.
 * 
 * @param {Array} zones - Array of zone objects.
 * @returns {number} A bitmask integer.
 */
export function getZStateBitmask(zones) {
    let zstate = 0;
    if (zones && Array.isArray(zones)) {
        // We use bitwise operations to compactly store the state of up to 31 zones 
        // in a single 32-bit signed integer. This keeps the generated URL share link short.
        zones.forEach((zone, index) => {
            if (index < 31 && zone.collapsed) {
                zstate |= (1 << index);
            }
        });
    }
    return zstate;
}

export const urlStateActions = {
    /**
     * Parses URL query parameters and updates the application state accordingly.
     * Handles parameters like 'editor', 'view', 'file', 'zstate', and 'data'.
     */
    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);

        this._urlHadData = false;
        this._urlSource = null;

        if (params.has('editor')) {
            this.editorVisible = params.get('editor') === '1' || params.get('editor') === 'true';
        }

        if (params.has('view')) {
            const v = params.get('view');
            if (v === 'map' || v === 'markdown') {
                this.globalView = v;
            }
        }

        if (params.has('file')) {
            const f = params.get('file');
            if (this.savedFiles.includes(f)) {
                this.currentFileName = f;
            }
        }

        if (params.has('zstate')) {
            this._urlZState = parseInt(params.get('zstate'), 10);
        }

        if (params.has('data') && typeof window.LZString !== 'undefined') {
            const decompressed = window.LZString.decompressFromEncodedURIComponent(params.get('data'));
            if (decompressed) {
                this.rawJson = decompressed;
                this.currentFileName = '';
                this._urlHadData = true;
            }
        }

        const sourceParam = params.get('source');
        if (sourceParam && sourceParam.trim()) {
            this._urlSource = sourceParam.trim();
        }
    },

    /**
     * Updates the browser's URL query parameters to reflect the current application state.
     * Replaces the history state without reloading the page.
     */
    updateUrlParams() {
        const url = new URL(window.location);
        url.searchParams.delete('data');
        url.searchParams.delete('source');
        url.searchParams.set('editor', this.editorVisible ? '1' : '0');
        url.searchParams.set('view', this.globalView);
        
        if (window.Alpine && window.Alpine.store('i18n')) {
            url.searchParams.set('lang', window.Alpine.store('i18n').locale);
        }
        
        if (this.currentFileName) {
            url.searchParams.set('file', this.currentFileName);
        } else {
            url.searchParams.delete('file');
        }

        if (this.data && this.data.zones) {
            url.searchParams.set('zstate', getZStateBitmask(this.data.zones));
        }
        
        window.history.replaceState({}, '', url);
    },

    /**
     * Generates a compressed shareable URL containing the current JSON data and zone states,
     * then copies it to the user's clipboard.
     */
    async generateShareLink() {
        if (typeof window.LZString === 'undefined') {
            await this.dialogAlert(i18next.t('js.shareUnavailable'), i18next.t('header.share'));
            return;
        }
        if (!this.rawJson || !this.rawJson.trim()) {
            await this.dialogAlert(i18next.t('js.shareNoData'), i18next.t('header.share'));
            return;
        }
        // Serialize the current state including zstate
        let zstate = getZStateBitmask(this.data && this.data.zones ? this.data.zones : []);
        let langStr = '';
        if (window.Alpine && window.Alpine.store('i18n')) {
            langStr = '&lang=' + window.Alpine.store('i18n').locale;
        }
        const compressed = window.LZString.compressToEncodedURIComponent(this.rawJson);
        const shareUrl = window.location.origin + window.location.pathname + '?zstate=' + zstate + langStr + '&data=' + compressed;
        try {
            await navigator.clipboard.writeText(shareUrl);
            await this.dialogAlert(i18next.t('js.shareLinkCopied'), i18next.t('header.share'));
        } catch {
            await this.dialogAlert(i18next.t('js.shareCopyFailed'), i18next.t('header.share'));
        }
    }
};
