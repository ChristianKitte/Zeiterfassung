from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse
import uuid
import shutil
import glob

class TimeTrackingHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.config = self.load_config()
        super().__init__(*args, **kwargs)

    def load_config(self):
        with open('config.json', 'r', encoding='utf-8') as f:
            return json.load(f)

    def _set_headers(self, content_type='application/json'):
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_headers()

    def do_GET(self):
        try:
            # API-Endpunkte
            if self.path == '/config.json':
                self.send_response(200)
                self._set_headers()
                with open('config.json', 'rb') as f:
                    self.wfile.write(f.read())
            elif self.path.startswith('/entries'):
                # Parameter aus URL extrahieren
                query = parse_qs(urlparse(self.path).query)
                date = query.get('date', [datetime.now().strftime('%Y-%m-%d')])[0]
                
                # Einträge für das Datum laden
                entries = self.load_entries_for_date(date)
                
                self.send_response(200)
                self._set_headers()
                self.wfile.write(json.dumps(entries).encode())
            elif self.path == '/dates':
                # Alle Daten mit Einträgen zurückgeben
                dates = self.get_dates_with_entries()
                self.send_response(200)
                self._set_headers()
                self.wfile.write(json.dumps(dates).encode())
            else:
                # Statische Dateien
                if self.path == '/':
                    self.path = '/index.html'
                try:
                    return SimpleHTTPRequestHandler.do_GET(self)
                except:
                    self.send_error(404, "File not found")
        except Exception as e:
            self.send_error(500, str(e))

    def do_POST(self):
        try:
            if self.path == '/save':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                # Eindeutige ID generieren
                data['id'] = str(uuid.uuid4())
                
                # Daten in Textdatei speichern
                with open(self.config['speicherort'], 'a', encoding='utf-8') as f:
                    f.write(json.dumps(data) + '\n')
                
                # Backup erstellen, wenn es noch keins für heute gibt
                self.create_backup_if_needed()
                
                self.send_response(200)
                self._set_headers()
                self.wfile.write(json.dumps({'status': 'success', 'id': data['id']}).encode())
            else:
                self.send_response(404)
                self._set_headers()
        except Exception as e:
            self.send_error(500, str(e))

    def do_DELETE(self):
        try:
            if self.path.startswith('/delete/'):
                entry_id = self.path.split('/')[-1]
                
                # Alle Einträge laden
                entries = self.load_all_entries()
                
                # Eintrag mit der ID entfernen
                entries = [e for e in entries if e['id'] != entry_id]
                
                # Aktualisierte Einträge speichern
                self.save_all_entries(entries)
                
                self.send_response(200)
                self._set_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode())
            else:
                self.send_response(404)
                self._set_headers()
        except Exception as e:
            self.send_error(500, str(e))

    def do_PUT(self):
        try:
            if self.path.startswith('/update/'):
                entry_id = self.path.split('/')[-1]
                content_length = int(self.headers['Content-Length'])
                put_data = self.rfile.read(content_length)
                updated_entry = json.loads(put_data.decode('utf-8'))
                
                # Alle Einträge laden
                entries = self.load_all_entries()
                
                # Eintrag aktualisieren
                for i, entry in enumerate(entries):
                    if entry['id'] == entry_id:
                        entries[i] = updated_entry
                        break
                
                # Aktualisierte Einträge speichern
                self.save_all_entries(entries)
                
                self.send_response(200)
                self._set_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode())
            else:
                self.send_response(404)
                self._set_headers()
        except Exception as e:
            self.send_error(500, str(e))

    def load_all_entries(self):
        entries = []
        if os.path.exists(self.config['speicherort']):
            with open(self.config['speicherort'], 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        entries.append(entry)
                    except json.JSONDecodeError:
                        continue
        return entries

    def load_entries_for_date(self, date):
        entries = self.load_all_entries()
        return [e for e in entries if e['date'] == date]

    def save_all_entries(self, entries):
        with open(self.config['speicherort'], 'w', encoding='utf-8') as f:
            for entry in entries:
                f.write(json.dumps(entry) + '\n')

    def get_dates_with_entries(self):
        entries = self.load_all_entries()
        dates = set(entry['date'] for entry in entries)
        return sorted(list(dates))

    def create_backup_if_needed(self):
        # Backup-Verzeichnis erstellen, falls nicht vorhanden
        if not os.path.exists(self.config['backup_verzeichnis']):
            os.makedirs(self.config['backup_verzeichnis'])

        # Heutiges Datum für den Backup-Dateinamen
        today = datetime.now().strftime('%Y-%m-%d')
        backup_file = os.path.join(self.config['backup_verzeichnis'], f'daten_{today}.txt')

        # Backup nur erstellen, wenn es noch keins für heute gibt
        if not os.path.exists(backup_file):
            shutil.copy2(self.config['speicherort'], backup_file)
            self.cleanup_old_backups()

    def cleanup_old_backups(self):
        # Alte Backups löschen
        backup_files = glob.glob(os.path.join(self.config['backup_verzeichnis'], 'daten_*.txt'))
        backup_files.sort()
        
        # Anzahl der zu behaltenden Backups
        keep_count = self.config['backup_tage_aufbewahren']
        
        # Zu viele Backups vorhanden?
        if len(backup_files) > keep_count:
            # Älteste Backups löschen
            for file in backup_files[:-keep_count]:
                os.remove(file)

def run(server_class=HTTPServer, handler_class=TimeTrackingHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Server läuft auf Port {port}')
    httpd.serve_forever()

if __name__ == '__main__':
    run() 