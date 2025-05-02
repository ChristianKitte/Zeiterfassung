![cropped-BewerbungHeader1](https://github.com/user-attachments/assets/de3a724b-4002-4e2b-80a4-e9d588bf1930)

# Zeiterfassung – Webbasierte Arbeitszeiterfassung

## Einführung

**Zeiterfassung** ist eine leichtgewichtige, webbasierte Anwendung zur Erfassung, Anzeige und Auswertung von Arbeitszeiten. Sie richtet sich an Einzelpersonen und kleine Teams, die ohne Cloud-Zwang oder komplexe Installation ihre Arbeitszeiten dokumentieren möchten. Die Anwendung läuft lokal im Browser und nutzt einen einfachen Python-Server im Hintergrund.

## Bedienung

1. **Start**
   - Starte den Python-Server mit `python server.py`.
   - Öffne die Anwendung im Browser (standardmäßig unter [http://localhost:8000](http://localhost:8000)).

2. **Eintrag hinzufügen**
   - Wähle das gewünschte Datum aus oder nutze das aktuelle.
   - Gib Startzeit, Endzeit und optional eine Bemerkung/Tätigkeit ein.
   - Klicke auf „Speichern“. Der Eintrag erscheint in der Tagesübersicht.

3. **Einträge anzeigen & bearbeiten**
   - Die Tagesübersicht zeigt alle Einträge für das gewählte Datum.
   - Die Dauer (HH:MM) zwischen Start- und Endzeit wird automatisch berechnet und angezeigt.
   - Einträge können bearbeitet oder gelöscht werden (Buttons rechts am Eintrag).

4. **Export als CSV**
   - Über den Button „Herunterladen“ kann die aktuelle Tagesansicht als CSV-Datei exportiert werden.

## Programmtechnische Umsetzung

### Architektur
- **Frontend:** HTML, Bootstrap 4, Vanilla JavaScript (in Module aufgeteilt: `utils.js`, `api.js`, `ui.js`, `script.js`)
- **Backend:** Python (einfacher HTTP-Server mit REST-API)
- **Datenhaltung:** JSON-Dateien auf dem Server (keine externe Datenbank notwendig)

### Code-Struktur
- **`index.html`**: Enthält das Layout und bindet alle JavaScript-Module ein.
- **`utils.js`**: Hilfsfunktionen für Zeitumrechnung, Formatierung, Dauerberechnung, CSV-Export.
- **`api.js`**: Kommunikation mit dem Server (Laden, Speichern, Löschen von Einträgen und Konfiguration).
- **`ui.js`**: DOM-Manipulation und Anzeige (z. B. Eintragsliste, Gesamtstunden, Meldungen).
- **`script.js`**: Initialisierung, Event-Listener, zentrale Steuerung.
- **`server.py`**: Python-Server, stellt die REST-API bereit, speichert und lädt Daten als JSON.

### Bedienlogik
- Die Anwendung ist für den Tagesbetrieb optimiert: Es wird immer ein Tag angezeigt und bearbeitet.
- Die Dauer zwischen Start- und Endzeit wird automatisch berechnet und im Eintrag angezeigt.
- Die Einträge werden lokal im Browser geladen und erst beim Speichern/Ändern mit dem Server synchronisiert.
- Die Exportfunktion bietet einen schnellen Weg, die Daten weiterzuverarbeiten (z. B. für Excel).

### Designentscheidungen
- **Modularisierung:** Die Aufteilung in mehrere JS-Dateien (`utils.js`, `api.js`, `ui.js`, `script.js`) erhöht die Wartbarkeit und Übersichtlichkeit. Hilfsfunktionen, Serverkommunikation und UI-Logik sind klar getrennt.
- **Einfache Bedienung:** Die Oberfläche ist bewusst minimalistisch gehalten. Die wichtigsten Funktionen sind direkt erreichbar.
- **Keine externe Datenbank:** Die Speicherung in JSON-Dateien macht die Anwendung portabel und leicht verständlich.
- **CSV-Export:** Ermöglicht eine flexible Weiterverarbeitung ohne spezielle Tools.
- **Bootstrap:** Für ein ansprechendes und responsives Design ohne viel eigenen CSS-Aufwand.

### Erweiterungsmöglichkeiten
- Wochen-/Monatsübersicht und Summen
- Mehrbenutzerbetrieb
- Authentifizierung
- Erweiterte Auswertungen und Filter

## Konfiguration

Die Datei `config.json` steuert zentrale Einstellungen der Anwendung. Sie befindet sich im Wurzelverzeichnis des Projekts und wird beim Start des Servers geladen. Änderungen an dieser Datei wirken sich direkt auf das Verhalten und Aussehen der Anwendung aus, ohne dass der Code angepasst werden muss.

**Wichtige Felder:**

- **speicherort**: Pfad zur Datei, in der die Arbeitszeit-Einträge dauerhaft gespeichert werden (z. B. `daten.txt`).
- **backup_verzeichnis**: Verzeichnis, in dem automatische Backups der Daten abgelegt werden.
- **backup_tage_aufbewahren**: Anzahl der Tage, die Backups aufbewahrt werden, bevor sie gelöscht werden.
- **tägliche_arbeitszeit**: Vorgabewert für die tägliche Soll-Arbeitszeit im Format `HH:MM` (z. B. `8:00`). Wird zur Berechnung der Zielerfüllung verwendet.
- **feiertage**: Liste von Datumswerten (Format `YYYY-MM-DD`), die als Feiertage behandelt werden. Sie können für spätere Erweiterungen (z. B. automatische Markierung) genutzt werden.
- **farben**: Objekt mit allen im Frontend verwendeten Farben. Die Namen sind sprechend und geben den Verwendungszweck an (z. B. `primary_button_bg`, `entry_time_text`, `total_hours_text_success`). Die Werte sind Hex-Farbcodes (z. B. `#007bff`).

**Einsatzort und Verwendung:**
- Die Konfiguration wird beim Start des Servers und beim Laden der Anwendung im Browser eingelesen.
- Änderungen an Farben wirken sich direkt auf die UI aus, sofern im Frontend auf die Werte aus `config.json` zugegriffen wird (z. B. für dynamische Styles oder Theme-Anpassungen).
- Die Datei ist der zentrale Ort für Anpassungen an Verhalten, Optik und Datenhaltung und sollte versioniert werden (z. B. in Git).

**Beispiel für den Bereich "farben":**
```json
"farben": {
    "primary_button_bg": "#007bff",
    "primary_button_text": "#fff",
    "danger_button_bg": "#dc3545",
    "danger_button_text": "#fff",
    "success_button_bg": "#28a745",
    "success_button_text": "#fff",
    "entry_time_text": "#212529",
    "entry_duration_text": "#6c757d",
    "entry_activity_text": "#212529",
    "entry_active_bg": "#e9ecef",
    "entry_bg": "#fff",
    "entry_border": "#dee2e6",
    "total_hours_text_success": "#28a745",
    "total_hours_text_danger": "#dc3545",
    "message_success_bg": "#d4edda",
    "message_success_text": "#155724",
    "message_error_bg": "#f8d7da",
    "message_error_text": "#721c24"
}
```

**Verwendungsorte der Farben:**

| Farbname                   | Verwendungsort in der Anwendung                                  |
|----------------------------|------------------------------------------------------------------|
| primary_button_bg          | Hintergrundfarbe für primäre Buttons (z. B. „Speichern“, Export)  |
| primary_button_text        | Textfarbe für primäre Buttons                                     |
| danger_button_bg           | Hintergrundfarbe für gefährliche Aktionen (z. B. „Entfernen“)     |
| danger_button_text         | Textfarbe für Danger-Buttons                                      |
| success_button_bg          | Hintergrundfarbe für Erfolgsbuttons (z. B. „Herunterladen“)       |
| success_button_text        | Textfarbe für Erfolgsbuttons                                      |
| entry_time_text            | Textfarbe der Start-/Endzeit eines Eintrags                       |
| entry_duration_text        | Textfarbe der Daueranzeige (zwischen Start und Ende, kursiv)      |
| entry_activity_text        | Textfarbe für die Tätigkeitsbeschreibung                          |
| entry_active_bg            | Hintergrundfarbe für ausgewählten/aktiven Eintrag                 |
| entry_bg                   | Standard-Hintergrundfarbe eines Eintrags                          |
| entry_border               | Rahmenfarbe der Einträge                                          |
| total_hours_text_success   | Textfarbe der Gesamtstunden bei erfülltem Soll                    |
| total_hours_text_danger    | Textfarbe der Gesamtstunden bei nicht erfülltem Soll              |
| message_success_bg         | Hintergrundfarbe für Erfolgsmeldungen                             |
| message_success_text       | Textfarbe für Erfolgsmeldungen                                    |
| message_error_bg           | Hintergrundfarbe für Fehlermeldungen                              |
| message_error_text         | Textfarbe für Fehlermeldungen                                     |

> **Hinweis:** Die Konfigurationsdatei muss valides JSON sein (keine Kommentare, keine abschließenden Kommata).

## Lizenz
Dieses Projekt steht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE) für Details.
