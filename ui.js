// UI- und DOM-Funktionen

function showMessage(text, type = 'success') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = type;
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 3000);
}

function updateTotalHours(entries, config) {
    const totalMinutes = calculateTotalTimeForDate(entries);
    const formattedTime = formatTimeFromMinutes(totalMinutes);
    const dailyWorkTime = config.daily_work_time || 8 * 60;
    const totalHoursElement = document.getElementById('totalHours');
    totalHoursElement.textContent = formattedTime;
    totalHoursElement.className = totalMinutes < dailyWorkTime ? 'text-danger' : 'text-success';
}

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
        entryElement.className = 'list-group-item list-group-item-action d-flex flex-column mb-2';
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
        entryElement.addEventListener('click', () => {
            document.querySelectorAll('#entriesList .list-group-item').forEach(el => el.classList.remove('active'));
            entryElement.classList.add('active');
        });
        entriesList.appendChild(entryElement);
    });
}

function updateDateList(dates, config) {
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
