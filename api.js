// API-Kommunikation (Server)

async function loadConfig() {
    try {
        const response = await fetch('/config.json');
        if (!response.ok) throw new Error('Fehler beim Laden der Konfiguration');
        const config = await response.json();
        if (config.tägliche_arbeitszeit) {
            const [hours, minutes] = config.tägliche_arbeitszeit.split(':').map(Number);
            config.daily_work_time = hours * 60 + minutes;
        } else {
            config.daily_work_time = 8 * 60;
        }
        return config;
    } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error);
        throw error;
    }
}

async function loadEntries(date) {
    const response = await fetch(`/entries?date=${date}`);
    if (!response.ok) throw new Error('Fehler beim Laden der Einträge');
    return await response.json();
}

async function loadDatesWithEntries() {
    const response = await fetch('/dates');
    if (!response.ok) throw new Error('Fehler beim Laden der Datumsliste');
    return await response.json();
}

async function saveEntry(entry) {
    const response = await fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    if (!response.ok) throw new Error('Fehler beim Speichern des Eintrags');
    return await response.json();
}

async function updateEntry(entry) {
    const response = await fetch(`/update/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    if (!response.ok) throw new Error('Fehler beim Aktualisieren des Eintrags');
    return await response.json();
}

async function deleteEntry(id) {
    const response = await fetch(`/delete/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Fehler beim Löschen des Eintrags');
    return await response.json();
}
