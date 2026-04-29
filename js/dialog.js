/**
 * Stellt Dialog-Management-Aktionen für Alert-, Confirm- und Prompt-Modale bereit.
 * Verlässt sich auf einen geteilten Zustand (`dialogOpen`, `dialogMode`, `_dialogResolve`, etc.),
 * um asynchrone Dialog-Abläufe mittels Promises zu verarbeiten.
 */
export const dialogActions = {
    /**
     * Behandelt den Druck auf die Escape-Taste, um das oberste offene Modal zu schließen.
     */
    onEscapeModal() {
        if (this.dialogOpen) this.dialogDismiss();
        else if (this.importModalOpen) this.importModalOpen = false;
    },

    /**
     * Bestätigt den aktuellen Dialog und löst das ausstehende Promise mit dem entsprechenden positiven Wert auf.
     */
    dialogConfirmOk() {
        // Cache and clear the resolver to prevent multiple invocations
        const r = this._dialogResolve;
        this._dialogResolve = null;
        this.dialogOpen = false;
        
        if (!r) return;
        
        // Resolve based on the active dialog mode
        if (this.dialogMode === 'alert') r();
        else if (this.dialogMode === 'confirm') r(true);
        else if (this.dialogMode === 'prompt') r(this.dialogInput);
    },

    /**
     * Schließt den aktuellen Dialog ab und löst das ausstehende Promise mit einem Standard-/Negativwert auf.
     */
    dialogDismiss() {
        // Cache and clear the resolver to prevent multiple invocations
        const r = this._dialogResolve;
        this._dialogResolve = null;
        this.dialogOpen = false;
        
        if (!r) return;
        
        // Resolve negatively based on the active dialog mode
        if (this.dialogMode === 'alert') r();
        else if (this.dialogMode === 'confirm') r(false);
        else if (this.dialogMode === 'prompt') r(null);
    },

    /**
     * Zeigt einen Warn-Dialog (Alert) an.
     * 
     * @param {string} message - Die anzuzeigende Nachricht.
     * @param {string} [title='Hinweis'] - Der Dialog-Titel.
     * @returns {Promise<void>} Wird aufgelöst, wenn der Dialog geschlossen oder bestätigt wird.
     */
    dialogAlert(message, title = 'Hinweis') {
        return new Promise((resolve) => {
            this.dialogMode = 'alert';
            this.dialogTitle = title;
            this.dialogMessage = message;
            this.dialogInput = '';
            this._dialogResolve = resolve;
            this.dialogOpen = true;
        });
    },

    /**
     * Zeigt einen Bestätigungs-Dialog (Confirm) an.
     * 
     * @param {string} message - Die anzuzeigende Nachricht.
     * @param {string} [title='Bestätigen'] - Der Dialog-Titel.
     * @returns {Promise<boolean>} Wird mit true aufgelöst, wenn bestätigt, ansonsten mit false.
     */
    dialogConfirm(message, title = 'Bestätigen') {
        return new Promise((resolve) => {
            this.dialogMode = 'confirm';
            this.dialogTitle = title;
            this.dialogMessage = message;
            this.dialogInput = '';
            this._dialogResolve = resolve;
            this.dialogOpen = true;
        });
    },

    /**
     * Zeigt einen Eingabe-Dialog (Prompt) an.
     * 
     * @param {string} message - Die anzuzeigende Nachricht.
     * @param {string} [defaultValue=''] - Der Initialwert für das Eingabefeld.
     * @param {string} [title='Eingabe'] - Der Dialog-Titel.
     * @returns {Promise<string|null>} Wird mit dem eingegebenen String aufgelöst oder mit null, wenn abgebrochen.
     */
    dialogPrompt(message, defaultValue = '', title = 'Eingabe') {
        return new Promise((resolve) => {
            this.dialogMode = 'prompt';
            this.dialogTitle = title;
            this.dialogMessage = message;
            this.dialogInput = defaultValue;
            this._dialogResolve = resolve;
            this.dialogOpen = true;
        });
    }
};
