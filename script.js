// Globale Variablen
let config = {};
let entries = [];
let datesWithEntries = [];

// Konfiguration beim Start laden
async function loadConfig() {
    try {
        const response = await fetch('/config.json');
        if (!response.ok) throw new Error('Fehler beim Laden der Konfiguration');
        config = await response.json();

        // Konvertiere die tägliche Arbeitszeit in Minuten
        if (config.tägliche_arbeitszeit) {
            const [hours, minutes] = config.tägliche_arbeitszeit.split(':').map(Number);
            config.daily_work_time = hours * 60 + minutes;
        } else {
            config.daily_work_time = 8 * 60; // Standard: 8 Stunden
        }

        console.log('Konfiguration geladen:', config);
    } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error);
        showMessage('Fehler beim Laden der Konfiguration', 'error');
    }
}

// Nachricht anzeigen
function showMessage(text, type = 'success') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = type;
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 3000);
}

// Zeiten in Minuten umrechnen
function timeToMinutes(time) {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Minuten in Zeit-String umrechnen
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
}

// Gesamtstunden berechnen
function calculateTotalHours(entries) {
    let totalMinutes = 0;
    entries.forEach(entry => {
        const startMinutes = timeToMinutes(entry.startTime);
        const endMinutes = timeToMinutes(entry.endTime);
        totalMinutes += endMinutes - startMinutes;
    });
    return minutesToTime(totalMinutes);
}

// Einträge laden
async function loadEntries(date) {
    try {
        const response = await fetch(`/entries?date=${date}`);
        if (!response.ok) throw new Error('Fehler beim Laden der Einträge');
        const entries = await response.json();

        const entriesList = document.getElementById('entriesList');
        entriesList.innerHTML = '';

        if (entries.length === 0) {
            entriesList.innerHTML = '<div class="list-group-item text-center">Keine Einträge für diesen Tag</div>';
            updateTotalHours([]);
            return;
        }

        // Einträge nach Startzeit sortieren
        entries.sort((a, b) => {
            const timeA = timeToMinutes(a.startTime);
            const timeB = timeToMinutes(b.startTime);
            return timeA - timeB;
        });

        // Datumsstring setzen bei Änderung Edit Datum
        const listDate = document.createElement('div');
        listDate.className = 'list-group-date';
        listDate.innerHTML = formatDate(date)
        entriesList.appendChild(listDate);

        // Einträge in die Liste einfügen
        entries.forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.className = 'list-group-item';
            entryElement.innerHTML = `
                <div class="d-flex align-items-start">
                    <div class="entry-time text-nowrap mr-3">
                        <strong>${entry.startTime} - ${entry.endTime}</strong>
                    </div>
                    <div class="entry-content flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="entry-activity flex-grow-1 text-break mr-3">
                                ${entry.activity || ''}
                            </div>
                            <div class="entry-actions flex-shrink-0">
                                <button class="btn btn-sm btn-primary mr-2" onclick="editEntry('${entry.id}')">Bearbeiten</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteEntry('${entry.id}')">Löschen</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            entriesList.appendChild(entryElement);
        });

        updateTotalHours(entries);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Daten mit Einträgen laden
async function loadDatesWithEntries() {
    try {
        const response = await fetch('/dates');
        if (!response.ok) throw new Error('Fehler beim Laden der Daten');
        datesWithEntries = await response.json();

        // Für jedes Datum die Einträge laden
        const dateList = document.getElementById('dateList');
        dateList.innerHTML = '';

        for (const date of datesWithEntries.sort().reverse()) {
            const entriesResponse = await fetch(`/entries?date=${date}`);
            if (!entriesResponse.ok) continue;
            const entries = await entriesResponse.json();

            const totalMinutes = calculateTotalTimeForDate(entries);
            const formattedTime = formatTimeFromMinutes(totalMinutes);

            const listItem = document.createElement('a');
            listItem.href = '#';
            listItem.className = 'list-group-item list-group-item-action date-list-item';
            listItem.dataset.date = date;

            // Farbklasse basierend auf der Arbeitszeit
            const dailyWorkTime = config.daily_work_time || 8 * 60;
            const timeClass = totalMinutes < dailyWorkTime ? 'text-danger' : 'text-success';

            listItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>${formatDate(date)}</span>
                    <span class="${timeClass}">${formattedTime}</span>
                </div>
            `;

            listItem.addEventListener('click', () => {
                document.getElementById('viewDate').value = date;
                loadEntries(date);
            });

            dateList.appendChild(listItem);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        showMessage('Fehler beim Laden der Daten', 'error');
    }
}

// Einträge speichern
async function saveEntry(entry) {
    try {
        // Prüfe auf zeitliche Überschneidungen
        const currentEntries = entries.filter(e => e.date === entry.date);
        if (hasTimeOverlap(currentEntries, entry)) {
            showMessage('Zeitliche Überschneidung mit bestehendem Eintrag', 'error');
            return;
        }

        const response = await fetch('/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry)
        });

        if (response.ok) {
            showMessage('Eintrag erfolgreich gespeichert');
            loadEntries(entry.date);
            loadDatesWithEntries();
            // Formular zurücksetzen
            document.getElementById('timeForm').reset();
            document.getElementById('date').value = entry.date;
        } else {
            throw new Error('Fehler beim Speichern');
        }
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showMessage('Fehler beim Speichern des Eintrags', 'error');
    }
}

// Eintrag löschen
async function deleteEntry(id) {
    try {
        const response = await fetch(`/delete/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Eintrag erfolgreich gelöscht');
            const currentDate = document.getElementById('viewDate').value;
            loadEntries(currentDate);
            loadDatesWithEntries();
        } else {
            throw new Error('Fehler beim Löschen');
        }
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        showMessage('Fehler beim Löschen des Eintrags', 'error');
    }
}

// Eintrag bearbeiten
function editEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (entry) {
        document.getElementById('editId').value = entry.id;
        document.getElementById('editDate').value = entry.date;
        document.getElementById('editStartTime').value = entry.startTime;
        document.getElementById('editEndTime').value = entry.endTime;
        document.getElementById('editActivity').value = entry.activity || '';
        $('#editModal').modal('show');
    }
}

// Prüfung auf zeitliche Überschneidungen
function hasTimeOverlap(entries, newEntry, excludeId = null) {
    const newStart = timeToMinutes(newEntry.startTime);
    const newEnd = timeToMinutes(newEntry.endTime);

    return entries.some(entry => {
        if (excludeId && entry.id === excludeId) return false;
        if (entry.date !== newEntry.date) return false;

        const entryStart = timeToMinutes(entry.startTime);
        const entryEnd = timeToMinutes(entry.endTime);

        return (newStart >= entryStart && newStart < entryEnd) ||
            (newEnd > entryStart && newEnd <= entryEnd) ||
            (newStart <= entryStart && newEnd >= entryEnd);
    });
}

// Eintrag aktualisieren
async function updateEntry(entry) {
    try {
        // Prüfe auf zeitliche Überschneidungen
        const currentEntries = entries.filter(e => e.date === entry.date);
        if (hasTimeOverlap(currentEntries, entry, entry.id)) {
            showMessage('Zeitliche Überschneidung mit bestehendem Eintrag', 'error');
            return;
        }

        const response = await fetch(`/update/${entry.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry)
        });

        if (response.ok) {
            showMessage('Eintrag erfolgreich aktualisiert');
            loadEntries(entry.date);
            loadDatesWithEntries();
        } else {
            throw new Error('Fehler beim Aktualisieren');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
        showMessage('Fehler beim Aktualisieren des Eintrags', 'error');
    }
}

// Eintragsliste aktualisieren
function updateEntriesList() {
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '';

    if (entries.length === 0) {
        entriesList.innerHTML = '<div class="list-group-item text-center">Keine Einträge für diesen Tag</div>';
        return;
    }

    entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'list-group-item';
        entryElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong class="text-nowrap">${entry.startTime} - ${entry.endTime}</strong>
                        <div>
                            <button class="btn btn-sm btn-primary mr-2" onclick="editEntry('${entry.id}')">Bearbeiten</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteEntry('${entry.id}')">Löschen</button>
                        </div>
                    </div>
                    ${entry.activity ? `<div class="mt-2">${entry.activity}</div>` : ''}
                </div>
            </div>
        `;
        entriesList.appendChild(entryElement);
    });
}

// Funktion zum Aktualisieren der Datumsliste
async function updateDateList() {
    try {
        // Alle Einträge auf einmal laden
        const response = await fetch('/entries');
        if (!response.ok) throw new Error('Fehler beim Laden der Einträge');
        const allEntries = await response.json();

        // Einträge nach Datum gruppieren
        const entriesByDate = {};
        allEntries.forEach(entry => {
            if (!entriesByDate[entry.date]) {
                entriesByDate[entry.date] = [];
            }
            entriesByDate[entry.date].push(entry);
        });

        const dateList = document.getElementById('dateList');
        dateList.innerHTML = '';

        // Datumsliste aktualisieren
        Object.keys(entriesByDate).sort().reverse().forEach(date => {
            const entries = entriesByDate[date];
            const totalMinutes = calculateTotalTimeForDate(entries);
            const formattedTime = formatTimeFromMinutes(totalMinutes);

            const listItem = document.createElement('a');
            listItem.href = '#';
            listItem.className = 'list-group-item list-group-item-action date-list-item';
            listItem.dataset.date = date;

            // Farbklasse basierend auf der Arbeitszeit
            const dailyWorkTime = config.daily_work_time || 8 * 60;
            const timeClass = totalMinutes < dailyWorkTime ? 'text-danger' : 'text-success';

            listItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>${formatDate(date)}</span>
                    <span class="${timeClass}">${formattedTime}</span>
                </div>
            `;

            listItem.addEventListener('click', () => {
                document.getElementById('viewDate').value = date;
                loadEntries(date);
            });

            dateList.appendChild(listItem);
        });
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Datum formatieren
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Gesamtstunden aktualisieren
function updateTotalHours(entries) {
    const totalMinutes = calculateTotalTimeForDate(entries);
    const formattedTime = formatTimeFromMinutes(totalMinutes);

    const dailyWorkTime = config.daily_work_time || 8 * 60;
    const totalHoursElement = document.getElementById('totalHours');
    totalHoursElement.textContent = formattedTime;
    totalHoursElement.className = totalMinutes < dailyWorkTime ? 'text-danger' : 'text-success';
}

// Event Listener
document.addEventListener('DOMContentLoaded', async () => {
    // Konfiguration laden
    await loadConfig();

    // Datum auf heute setzen
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('viewDate').value = today;

    // Einträge für heute laden und Datumsliste aktualisieren
    await loadDatesWithEntries();
    loadEntries(today);

    // Datumsauswahl-Event
    document.getElementById('viewDate').addEventListener('change', (e) => {
        loadEntries(e.target.value);
    });

    // Formular-Handler
    document.getElementById('timeForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const entry = {
            date: document.getElementById('date').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            activity: document.getElementById('activity').value.trim() || null
        };
        saveEntry(entry);
    });

    // **New Event Listener for Date Change in Form**
    document.getElementById('date').addEventListener('change', function() {
        const selectedDate = this.value;
        loadEntries(selectedDate);
    });

    // Bearbeitungsformular-Handler
    document.getElementById('saveEdit').addEventListener('click', function () {
        const entry = {
            id: document.getElementById('editId').value,
            date: document.getElementById('editDate').value,
            startTime: document.getElementById('editStartTime').value,
            endTime: document.getElementById('editEndTime').value,
            activity: document.getElementById('editActivity').value.trim() || null
        };
        updateEntry(entry);
        $('#editModal').modal('hide');
    });
});

// Funktion zum Berechnen der Gesamtzeit für ein Datum
function calculateTotalTimeForDate(entries) {
    let totalMinutes = 0;
    entries.forEach(entry => {
        const startMinutes = timeToMinutes(entry.startTime);
        const endMinutes = timeToMinutes(entry.endTime);
        totalMinutes += endMinutes - startMinutes;
    });
    return totalMinutes;
}

// Funktion zum Formatieren der Zeit in Stunden:Minuten
function formatTimeFromMinutes(minutes) {
    if (isNaN(minutes)) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
} 