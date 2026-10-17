# Fortuna Ehrenfeld Schalalameter

*Sprache von vor und nach der Sprache.*

Wie oft singen Fortuna Ehrenfeld „piu piu“, „schalala“ und Co.? Die Seite zeigt die Laute aller Lieder als gestapelte Kurven über die Jahre. Ein Klick auf ein Jahr listet dessen Lieder, sortiert nach Anzahl der Laute.

Statische Website ohne Server und ohne Build-Schritt. Gespeichert werden nur Zählungen, keine Liedtexte.

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html`, `assets/app.js` | öffentliche Seite |
| `werkstatt.html`, `assets/werkstatt.js` | interne Pflege: Daten laden, neue Laute freigeben, Zählungen erfassen |
| `assets/core.js` | gemeinsame Logik (beste Zählung, Jahre, Muster fürs Vorzählen) |
| `daten/shalalameter-daten.json` | **die Daten**, Format siehe unten |
| `impressum.html`, `datenschutz.html` | Pflichtseiten, Platzhalter `[…]` vor dem Start ausfüllen |
| `tests/` | `npm test` |
| `tools/serve.js` | lokaler Server: `npm start` → http://localhost:8080 |

## Daten aktualisieren

1. `npm start` und http://localhost:8080/werkstatt.html öffnen (oder die Werkstatt auf der Live-Seite).
2. Cowork-Datei laden, neue Laute prüfen, Zählungen ergänzen.
3. „Vorschau“ prüfen, dann „Datei herunterladen“.
4. Die Datei nach `daten/shalalameter-daten.json` kopieren, `npm test`, committen, pushen. Bei Änderungen an CSS oder JS vorher `npm run cachebust` (neue Versionsnummer gegen veraltete Browser-Caches). GitHub Pages ist nach etwa einer Minute aktuell.

Der Entwurf der Werkstatt liegt nur im jeweiligen Browser. Veröffentlicht ist erst, was im Repository liegt.

## Datenformat

```json
{
  "version": 1,
  "laute":  [{"id": "piu", "name": "Piu piu", "status": "freigegeben"}],
  "lieder": [{"id": "…", "titel": "…", "erstveroeffentlichung": "2021-04-30",
              "veroeffentlichung": "…", "auch_auf": [], "typ": "original|uebersetzung|cover|unklar"}],
  "zaehlungen": [{"lied_id": "…", "grundlage": "online_text|booklet|gehoert", "quelle_url": "…",
                  "gezaehlt_von": "…", "gezaehlt_am": "2026-10-16", "status": "gezaehlt|kein_text_gefunden",
                  "werte": {"piu": 2}, "anzahl_aufgeloest": null, "kandidaten": {"hey hey": 1},
                  "sicherheit": "hoch|mittel|niedrig", "notiz": ""}],
  "kandidaten_verworfen": []
}
```

Ein Laut kann `aliase` haben (Liste von Schreibweisen): Fanvorschläge mit einem dieser Texte zählen für ihn.

Laute gehören zu Familien (je Laut `familie`). Eine Familie hat:

```json
{"id": "shalala", "name": "Schalala", "anzeigename": "Schalalamente", "untertitel": "Schalala",
 "steckbrief": "Die Silbe für alles, was zugleich egal und heilig ist."}
```

`id` ist die feste Kennung (bleibt, damit die Zuordnung der Laute nicht bricht), `name` der bisherige Name (zeigt die Werkstatt), `anzeigename`, `untertitel` und `steckbrief` zeigt die öffentliche Seite. Die Kurven zeigen Familien, eine Farbe pro Familie in fester Reihenfolge (höchstens 8); ein Klick auf eine Familie öffnet ihren Steckbrief und zeigt ihre Schalalas einzeln. Die Übersicht „Alle Schalalas“ zeigt jeden Laut einzeln. Neu freigegebene Laute landen in „Weitere Laute“ und lassen sich in der Datei umhängen.

Die Familien: Spatzenlaser (Piu piu), Schalalamente (Schalala), Silbenhack (La la, Da da und Co), Rummse (Bumm und Kawumm), DNA Elemente eines erfüllten Lebens (Oh, Ah, Uh), Täterätätä im Pyjama (Dudeln und Tröten), Daseinslaute (Hey, Yeah, Olé).

### Albumphasen

Die x-Achse zeigt Albumphasen statt Jahren, in Erscheinungsreihenfolge und gleichmäßig verteilt. Die Phasen stehen in `alben`:

```json
{"id": "rueckkehr", "titel": "Die Rückkehr zur Normalität", "kurz": "Rückkehr", "datum": "2021-06-04", "reihenfolge": 4}
```

Die Achse zeigt statt Namen die Cover aus `assets/cover/<id>.jpg` (Cover Art Archive, 250 px); ein anderer Pfad lässt sich im Feld `cover` des Albums angeben. `titel` muss so geschrieben sein wie in `veroeffentlichung` („Titel (Album)“) und `auch_auf` („Titel (Datum)“). Keine eigenen Phasen bekommen das Übersetzungsalbum „Debout pour ma prière“ und die Livealben; „Live at the Hollywood Bowl“ gilt als Studioalbum.

Die Phase eines Lieds wird berechnet, Regeln in dieser Reihenfolge:

1. Überschreibung im Feld `phase` des Lieds gewinnt immer.
2. Übersetzung (`typ: uebersetzung`): Phase des Originals über `original_id`.
3. Lied steht auf einem Studioalbum (`veroeffentlichung` oder `auch_auf`): dieses Album, bei mehreren das zuerst erschienene.
4. Sonst das Album mit dem geringsten Abstand in Tagen zur Erstveröffentlichung. Bei Gleichstand meldet die Werkstatt „bitte festlegen“.

Gespeichert ist `phase` nur bei den festgelegten Überschreibungen: die Lieder der Regenradar-EP und „Trust Me, I'm an Alien!“ (Helm ab zum Gebet) sowie „Weltuntergang“ (Die Rückkehr zur Normalität). In der Werkstatt lässt sich die Phase pro Lied ansehen und überschreiben.

### Fanzählungen (Supabase)

Über `zaehlen.html` („Zähl mit“, verlinkt auf der Startseite und an jedem Lied) reichen Fans ohne Anmeldung eine Zählung für ein Lied und einen Laut ein, oder schlagen einen neuen Laut vor. Die Einreichungen liegen in Supabase; die Startseite lädt sie beim Öffnen (höchstens 3 Sekunden, sonst nur die Datendatei) und rechnet sie ein. Die Datendatei bleibt unverändert.

Konsens je Lied und Laut (`consensus` und `fanZaehlungen` in `assets/core.js`): Die bisherige beste Zählung aus der Datendatei (ohne Booklet) zählt als erste Stimme. Unter 3 Stimmen gilt der Durchschnitt, aufgerundet; ab 3 der häufigste Wert, bei Gleichstand der Median aller Stimmen, aufgerundet. Laute ohne Fanstimme behalten den Wert der Datendatei. Unbekannte Lied- oder Laut-IDs zählen nicht. Rangfolge in `bestOf`: Booklet vor Fankonsens vor „nach Gehör“ (Werkstatt) vor Onlinetext.

Einrichtung: `supabase/tabelle.sql` einmal im SQL Editor ausführen, dann Projektadresse und öffentlichen Schlüssel (anon oder publishable, nie service_role) in `assets/supabase-config.js` eintragen. Die Rolle anon darf nur die Funktion `zaehlung_einreichen` ausführen und die Ansicht `fan_zaehlungen_oeffentlich` lesen (ohne Gerät und Spitzname, ohne gesperrte Einträge). Höchstens 30 Einreichungen je Gerät und Stunde.

Sperren: in Supabase im Table Editor bei `fan_zaehlungen` die Spalte `gesperrt` auf `true` setzen, oder im SQL Editor `update public.fan_zaehlungen set gesperrt = true where id = 123;` (alle eines Spitznamens: `where spitzname = '…'`). Gesperrte Einträge verschwinden sofort aus der Ansicht und damit von der Seite.

Pro Lied kann es mehrere Zählungen geben. Angezeigt wird die verlässlichste: Booklet vor Gehör vor Online-Text, dann Sicherheit, Quellenart, mehr Laute, dann die neueste.

Zählregel: Gezählt wird, was kein Wort mehr schafft. Eine Lautfolge zählt einmal („piu piu piu“ = 1). Komma und Zeilenumbruch trennen Lautfolgen („schalala, schalala“ = 2). Das Vorzählen erkennt beide Schreibweisen (Shalala, Schalala, Sha la la, Scha la la) als denselben Laut.

Schreibweise: sichtbar immer „Schalala“. Interne Kennungen, Dateinamen, Repository und URL heißen weiter `shalala` bzw. `shalalameter`.

## Schriften

Shrikhand, Instrument Sans und JetBrains Mono, selbst gehostet (SIL Open Font License), damit keine Verbindung zu Google Fonts entsteht.
