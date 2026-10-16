# Fortuna Ehrenfeld Shalalameter

Wie oft singen Fortuna Ehrenfeld „piu piu“, „shalala“ und Co.? Die Seite zeigt die Laute aller Lieder als gestapelte Kurven über die Jahre. Ein Klick auf ein Jahr listet dessen Lieder, sortiert nach Anzahl der Laute.

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
4. Die Datei nach `daten/shalalameter-daten.json` kopieren, `npm test`, committen, pushen. GitHub Pages ist nach etwa einer Minute aktuell.

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

Pro Lied kann es mehrere Zählungen geben. Angezeigt wird die verlässlichste: Booklet vor Gehör vor Online-Text, dann Sicherheit, dann die neueste. Höchstens 8 Laute gleichzeitig, eine Farbe pro Laut in fester Reihenfolge.

Zählregel: eine Lautfolge zählt einmal („piu piu piu“ = 1). Komma und Zeilenumbruch trennen Lautfolgen („shalala, shalala“ = 2).

## Schriften

Shrikhand, Instrument Sans und JetBrains Mono, selbst gehostet (SIL Open Font License), damit keine Verbindung zu Google Fonts entsteht.
