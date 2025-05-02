// Globale Variablen
let config = {};
let entries = [];
let datesWithEntries = [];

// Hilfsfunktion: Liefert ein valides Datum im Format YYYY-MM-DD
function getValidDateString(dateStr) {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) {
        return new Date().toISOString().split('T')[0];
    }
    return dateStr;
}

// Zentrale Synchronisationsfunktion
async function refreshAll(selectedDate = null) {
    try {
        datesWithEntries = await loadDatesWithEntries();
        await updateDateList(datesWithEntries, config);
        let date = selectedDate || document.getElementById('viewDate').value;
        date = getValidDateString(date);
        document.getElementById('viewDate').value = date;
        entries = await loadEntries(date);
        updateEntriesList(entries, config, date);
        updateTotalHours(entries, config);
    } catch (error) {
        showMessage('Fehler bei der Synchronisierung', 'error');
        console.error(error);
    }
}

// Angepasstes loadEntries: Option, Anzeige nicht direkt zu aktualisieren
async function loadEntries(date, updateUI = true) {
    try {
        const response = await fetch(`/entries?date=${date}`);
        if (!response.ok) throw new Error('Fehler beim Laden der Einträge');
        const loadedEntries = await response.json();
        if (updateUI) {
            updateEntriesList(loadedEntries, config, date);
            updateTotalHours(loadedEntries);
        }
        return loadedEntries;
    } catch (error) {
        showMessage(error.message, 'error');
        return [];
    }
}

// updateEntriesList nimmt jetzt das Datum als Parameter
function updateEntriesList(entries, config, date) {
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '';

    // Datumsstring immer anzeigen
    const listDate = document.createElement('div');
    listDate.className = 'list-group-date';
    listDate.innerHTML = formatDate(date);
    entriesList.appendChild(listDate);

    if (!entries || entries.length === 0) {
        entriesList.innerHTML += '<div class="list-group-item text-center">Keine Einträge für diesen Tag</div>';
        return;
    }

    // Einträge nach Startzeit sortieren
    entries.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'list-group-item';
        entryElement.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="entry-time text-nowrap mr-3">
                    <strong>${formatTimeDisplay(entry.startTime)} - ${formatTimeDisplay(entry.endTime)}</strong>
                </div>
                <div class="entry-content flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <span class="text-muted" style="font-style: italic; margin-left: 8px; margin-right: 24px;">
                            (${formatDuration(entry.startTime, entry.endTime)})
                        </span>
                        <div class="entry-activity flex-grow-1 text-break mr-3">
                            ${entry.activity || ''}
                        </div>
                        <div class="entry-actions flex-shrink-0">
                            <button class="btn btn-sm btn-primary mr-2" onclick="editEntry('${entry.id}')">Editieren</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteEntry('${entry.id}')">Entfernen</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        entriesList.appendChild(entryElement);
    });
}

// updateDateList nutzt jetzt das globale datesWithEntries
async function updateDateList(dates, config) {
    const dateList = document.getElementById('dateList');
    dateList.innerHTML = '';
    if (!dates || dates.length === 0) return;
    dates.sort().reverse().forEach(date => {
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item list-group-item-action';
        listItem.textContent = formatDate(date);
        listItem.addEventListener('click', () => {
            document.getElementById('viewDate').value = date;
            refreshAll(date);
        });
        dateList.appendChild(listItem);
    });
}

// loadDatesWithEntries gibt jetzt ein Array zurück
async function loadDatesWithEntries() {
    try {
        const response = await fetch('/dates');
        if (!response.ok) throw new Error('Fehler beim Laden der Daten');
        return await response.json();
    } catch (error) {
        showMessage('Fehler beim Laden der Datumsliste', 'error');
        return [];
    }
}

// saveEntry, updateEntry, deleteEntry rufen jetzt immer refreshAll auf
async function saveEntry(entry) {
    try {
        const currentEntries = entries.filter(e => e.date === entry.date);
        if (hasTimeOverlap(currentEntries, entry)) {
            showMessage('Zeitliche Überschneidung mit bestehendem Eintrag', 'error');
            return;
        }
        const response = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        if (!response.ok) throw new Error('Fehler beim Speichern');
        showMessage('Eintrag erfolgreich gespeichert');
        await refreshAll(entry.date);
        document.getElementById('timeForm').reset();
        document.getElementById('date').value = entry.date;
    } catch (error) {
        showMessage('Fehler beim Speichern des Eintrags', 'error');
    }
}

async function updateEntry(entry) {
    try {
        const currentEntries = entries.filter(e => e.date === entry.date);
        if (hasTimeOverlap(currentEntries, entry, entry.id)) {
            showMessage('Zeitliche Überschneidung mit bestehendem Eintrag', 'error');
            return;
        }
        const response = await fetch(`/update/${entry.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        if (!response.ok) throw new Error('Fehler beim Aktualisieren');
        showMessage('Eintrag erfolgreich aktualisiert');
        await refreshAll(entry.date);
    } catch (error) {
        showMessage('Fehler beim Aktualisieren des Eintrags', 'error');
    }
}

async function deleteEntry(id) {
    try {
        const response = await fetch(`/delete/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Fehler beim Löschen');
        showMessage('Eintrag erfolgreich gelöscht');
        await refreshAll();
    } catch (error) {
        showMessage('Fehler beim Löschen des Eintrags', 'error');
    }
}

// Initialisierung

document.addEventListener('DOMContentLoaded', async () => {
    try {
        config = await loadConfig();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        document.getElementById('viewDate').value = today;
        await refreshAll(today);
        document.getElementById('viewDate').addEventListener('change', async (e) => {
            await refreshAll(e.target.value);
        });
        document.getElementById('timeForm').addEventListener('submit', async function (event) {
            event.preventDefault();
            const entry = {
                date: document.getElementById('date').value,
                startTime: document.getElementById('startTime').value,
                endTime: document.getElementById('endTime').value,
                activity: document.getElementById('activity').value.trim() || null
            };
            if (timeToMinutes(entry.endTime) < timeToMinutes(entry.startTime)) {
                showMessage('Endzeit darf nicht vor Startzeit liegen!', 'error');
                return;
            }
            const currentEntries = entries.filter(e => e.date === entry.date);
            if (hasTimeOverlap(currentEntries, entry)) {
                showMessage('Zeitliche Überschneidung mit bestehendem Eintrag', 'error');
                return;
            }
            await saveEntry(entry);
            showMessage('Eintrag gespeichert!', 'success');
            await refreshAll(entry.date);
            document.getElementById('timeForm').reset();
            document.getElementById('date').value = entry.date;
        });
        document.getElementById('saveEdit').addEventListener('click', async function () {
            const entry = {
                id: document.getElementById('editId').value,
                date: document.getElementById('editDate').value,
                startTime: document.getElementById('editStartTime').value,
                endTime: document.getElementById('editEndTime').value,
                activity: document.getElementById('editActivity').value.trim() || null
            };
            if (timeToMinutes(entry.endTime) < timeToMinutes(entry.startTime)) {
                showMessage('Endzeit darf nicht vor Startzeit liegen!', 'error');
                return;
            }
            const currentEntries = entries.filter(e => e.date === entry.date);
            if (hasTimeOverlap(currentEntries, entry, entry.id)) {
                showMessage('Zeitliche Überschneidung mit bestehendem Eintrag', 'error');
                return;
            }
            await updateEntry(entry);
            showMessage('Eintrag aktualisiert!', 'success');
            await refreshAll(entry.date);
            $('#editModal').modal('hide');
        });
        document.getElementById('exportCsvBtn').addEventListener('click', function () {
            exportEntriesToCSV(entries);
        });
    } catch (error) {
        showMessage('Fehler beim Initialisieren der Anwendung', 'error');
        console.error(error);
    }
});

// Hilfsfunktion zum Nachladen und Anzeigen der Einträge
async function reloadEntries(date) {
    try {
        entries = await loadEntries(date);
        updateEntriesList(entries, config);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Datumsliste aktualisieren (keine Duplikate)
async function updateDateList() {
    try {
        const dates = await loadDatesWithEntries();
        const dateList = document.getElementById('dateList');
        dateList.innerHTML = '';
        dates.sort().reverse().forEach(date => {
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item list-group-item-action';
            listItem.textContent = formatDate(date);
            listItem.addEventListener('click', () => {
                document.getElementById('viewDate').value = date;
                reloadEntries(date);
            });
            dateList.appendChild(listItem);
        });
    } catch (error) {
        showMessage('Fehler beim Laden der Datumsliste', 'error');
    }
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
function formatDuration(start, end) {
    // start, end: 'HH:MM'
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;
    // Falls über Mitternacht
    if (endMinutes < startMinutes) endMinutes += 24 * 60;
    const diff = endMinutes - startMinutes;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}

function exportEntriesToCSV(entries) {
    if (!entries || entries.length === 0) {
        alert('Keine Einträge zum Exportieren vorhanden.');
        return;
    }
    // CSV-Header
    const header = ['Datum', 'Startzeit', 'Endzeit', 'Dauer', 'Bemerkung'];
    const rows = entries.map(entry => {
        const dauer = formatDuration(entry.startTime, entry.endTime);
        // Escape Doppelte Anführungszeichen
        const activity = (entry.activity || '').replace(/"/g, '""');
        return [
            entry.date,
            entry.startTime,
            entry.endTime,
            dauer,
            '"' + activity + '"'
        ].join(',');
    });
    const csvContent = [header.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Zeiterfassung_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Einträge laden
function formatDuration(start, end) {
    // start, end: 'HH:MM'
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;
    // Falls über Mitternacht
    if (endMinutes < startMinutes) endMinutes += 24 * 60;
    const diff = endMinutes - startMinutes;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}

// Datum formatieren
function formatDate(dateString) {
    if (!dateString || isNaN(new Date(dateString).getTime())) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Uhrzeit im deutschen 24h-Format mit führenden Nullen anzeigen
function formatTimeDisplay(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Gesamtstunden aktualisieren
function updateTotalHours(entries, config) {
    const totalMinutes = calculateTotalTimeForDate(entries);
    const formattedTime = formatTimeFromMinutes(totalMinutes);

    const dailyWorkTime = config.daily_work_time || 8 * 60;
    const totalHoursElement = document.getElementById('totalHours');
    totalHoursElement.textContent = formattedTime;
    totalHoursElement.className = totalMinutes < dailyWorkTime ? 'text-danger' : 'text-success';
}


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