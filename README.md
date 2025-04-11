![cropped-BewerbungHeader1](https://github.com/user-attachments/assets/de3a724b-4002-4e2b-80a4-e9d588bf1930)

## Zeiterfassug

Bei der **Zeiterfassung** handelt es sich um eine sehr einfache, lokal laufende Webanwendung, um Zeiten zu erfassen. Eingegebene Zeiten
werden innerhalb einer Textdatei gespeichert. Zu jeder Zeit kann eine Beschreibung hinzugefügt werden. Die ungewöhnliche Nutzung
einer Textdatei macht es sehr einfach, Einträge zu sichern, aber auch zu sichten und weiter zu verarbeiten. 

Technisch gesehen handelt es sich um eine **Webseite** mit **Javascript** und **CSS**. Für das Layout wird das Framework **Bootstrap** 
eingesetzt. Für die lokale Ausführung muss die Anwendung gehostet werden. Dies geschieht durch einen Python Server. In der Datei **server.py**
wird dieser definiert. Der Server stellt zudem erweiterte Funktionalität zur Verfügung und bietet sie via einer API an.

Große Teile der Anwendung wurden mit den Programmen **Windsurf** und **Cluster** erstellt. Als einfacher und wenig "professionelle"
Anweisung kam hierbei initial der im Folgenden gezeigte Prompt zu Einsatz:

```
Erstelle mir das Grundgerüst für eine Zeiterfassung. Der Technik Stack ist HTML, JS, CSS, Bootstrap. Die
Anwendung soll lokal laufen, gehosten von einem Python Server. Erstelle zum Starten ein Skript. Alle Daten
sollen in Textform gehalten werden und es muss eine Konfiguration mit JSON möglich sein. Speicherorte und
die regelmäßige tägliche Arbeitszeit müssen konfigurierbar sein. Ebenso eine Liste mit Feiertagen.
```

Erst im weiteren Verlauf der Arbeiten musste an ein paar Stellen händisch nachgebessert werden. Hier konnten bei der Verwendung
des **GitHup Copiloten** gute Erfahrungen gemacht werden. Die Aufgabe des Copiloten bestand hierbei nicht in der Generierung von Code, 
sondern der Hilfestellung in Form von Erklärungen, Analysen und Vorschlägen. Insgesamt kann gesagt werden, dass alle Werkzeuge überraschend
gut performten. Der ausgegebene Sourcecode ist gut strukturiert, formatiert sowie klar nach zu vollziehen. Insbesonders konnte der 
Copilot alle zum Code gestellten Fragen sehr gut beantworten. Für alle Tools gilt, dass durch deren Einsatz der Zeitaufwand rapide reduziert 
werden konnte.


Das Erscheinungsbild der Webanwendung, wie unten zu sehen, stellt sich sehr aufgeräumt und eher intuitiv dar. Anzumerken ist jedoch,
dass es durchaus Verbesserungspotential hat, wenn auch bereits auf etwas höheren Niveau. Zudem wurde das Layout im Entstehungsprozess 
explizit angepasst, respektive einzelne Details angewiesen. Es handelt sich somit nicht um den initialen Entwurf der IDE.

![image](https://github.com/user-attachments/assets/b79889e0-d070-407f-bff3-833c78cfb910)

Aktuell werden noch keine Feiertage unterstützt sowie Tage mit Einträgen nicht im Kalender farblich unterlegt. Auch lassen sich die Einträge im
nachhinein nicht editieren (Problem beim Click Event des Button). 
