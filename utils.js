// Hilfsfunktionen für Zeit- und Formatierungsoperationen

function timeToMinutes(time) {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
}

function formatDuration(start, end) {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;
    if (endMinutes < startMinutes) endMinutes += 24 * 60;
    const diff = endMinutes - startMinutes;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
    if (!dateString || isNaN(new Date(dateString).getTime())) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit'
    });
}

function formatTimeDisplay(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function calculateTotalTimeForDate(entries) {
    let totalMinutes = 0;
    entries.forEach(entry => {
        const startMinutes = timeToMinutes(entry.startTime);
        const endMinutes = timeToMinutes(entry.endTime);
        totalMinutes += endMinutes - startMinutes;
    });
    return totalMinutes;
}

function formatTimeFromMinutes(minutes) {
    if (isNaN(minutes)) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
}

function getValidDateString(dateStr) {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) {
        return new Date().toISOString().split('T')[0];
    }
    return dateStr;
}

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

function exportEntriesToCSV(entries) {
    if (!entries || entries.length === 0) {
        alert('Keine Einträge zum Exportieren vorhanden.');
        return;
    }
    const header = ['Datum', 'Startzeit', 'Endzeit', 'Dauer', 'Bemerkung'];
    const rows = entries.map(entry => {
        const dauer = formatDuration(entry.startTime, entry.endTime);
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
