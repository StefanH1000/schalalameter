# Übergabe: Fortuna Ehrenfeld Shalalameter

Stand: 16.10.2026

## Worum es geht

Das Shalalameter zeigt, wie oft Fortuna Ehrenfeld lautmalerische Laute wie „Shalala“, „Da-da“ oder „Oh-oh-oh“ singen, und wie sich das über die Jahre verändert. Einstieg ist ein Diagramm mit gestapelten Kurven pro Jahr. Ein Klick auf ein Jahr listet dessen Lieder, sortiert nach Anzahl der Laute. Darunter steht eine Übersicht aller einzelnen Laute pro Jahr.

Das Projekt ist ein Fanprojekt. **Das Fortuna-Team ist einverstanden.** Veröffentlicht werden nur Zählungen, keine Liedtexte.

| | |
|---|---|
| Live-Seite | https://stefanh1000.github.io/shalalameter/ |
| Werkstatt (intern, nicht verlinkt) | https://stefanh1000.github.io/shalalameter/werkstatt.html |
| Repository | https://github.com/StefanH1000/shalalameter (öffentlich, Branch `main`) |
| Hosting | GitHub Pages, baut automatisch bei jedem Push auf `main` |
| Lokaler Ordner | `C:\Users\hoch\shalalameter` |

## Stand der Daten

Grundlage ist eine Auszählung durch Claude Cowork vom 16.10.2026, nur nach online verfügbaren Liedtexten (Shazam/Apple, sonichits.com/LyricFind, songtexte.com, lyricstranslate.com).

- **169 Lieder** nach Bereinigung: jedes Lied nur einmal, im Jahr seiner Erstveröffentlichung. Live-Fassungen und Radio Edits sind zusammengeführt.
- Davon 145 eigene Lieder, 11 französische Übersetzungen, 10 Cover und 3 unklare Fälle. Standardmäßig zeigt die Seite nur eigene Lieder.
- **105 Lieder gezählt, 54 ohne auffindbaren Text.** Es fehlen fast das ganze Album „Himmelerdenblau“ (2025), alle französischen Fassungen und neun Titel von „Glitzerschwein“.
- **29 Laute in 7 Familien**, alle freigegeben:

| Familie | Laute | Summe (eigene Lieder) |
|---|---|---|
| Piu piu | Piu piu | 0 |
| Shalala | Shalala | 51 |
| La-la, Da-da & Co. | Da-da, Lalala, Ba-ba-ba, Da-da-da, Ladi dadi dai, Lo-lo-lo, Nanana | 73 |
| Bumm & Kawumm | Bumm, Kawumm, Boom laboom | 13 |
| Oh, Ah, Uh | Ah-ah-oh-ah-ah, Oh-oh-oh, Ah-uh, Ah-ah, Mh-mh-mh-hm, Ah-ah-ah, Uh, uh, uh | 47 |
| Dudeln & Tröten | Dum-didi-dum, Tä-tä-rä-tä-tä, Fuzzi fuzzi fuzz, Humpe täterää, Dudeldudeldudel | 16 |
| Hey, Yeah, Olé | Whoopie whoopie, Yeah yeah yeah, Olé, Hey hey hey, Hooray hooray | 14 |

Auffällig: Shalala hat seinen Gipfel 2021 (30, davon 16 in „Arschloch, Wixer, Hurensohn!“). 2019 ragt durch 48× „Da-da“ in „Sanktpankpaul“ heraus. **Piu piu kommt in keinem Online-Text vor.**

## Regeln, die in den Zahlen stecken

**Zählregel**
- Eine Lautfolge zählt einmal: „piu piu piu“ = 1.
- Komma und Zeilenumbruch trennen Lautfolgen: „shalala, shalala“ = 2.
- Gezählt wird, was im Text steht. Wo ein Text nur „(2x)“ oder „Refrain“ enthält, kann eine aufgelöste Zahl in `anzahl_aufgeloest` stehen. Die Seite nutzt sie nur, wenn der Filter „Refrains ausgeschrieben“ aktiv ist.
- Ein Laut im Liedtitel zählt nicht.

**Welche Zählung gilt, wenn es mehrere gibt** (`bestOf` in `assets/core.js`), in dieser Reihenfolge:
1. Grundlage: Booklet vor Gehör vor Online-Text.
2. Sicherheit: hoch vor mittel vor niedrig.
3. Quellenart: offiziell vor lizenziert vor Community.
4. Mehr Laute: zuerst feste Laute, dann notierte Kandidaten. Online-Texte kürzen Laute eher weg, als dass sie welche erfinden.
5. Die neueste Zählung.

Neue Laute (Kandidaten) zählen nur aus der jeweils besten Zählung, sonst würden sie bei mehreren Quellen doppelt gezählt.

**Darstellung**
- Die Farbe folgt der Familie in fester Reihenfolge, nie dem Rang. Es gibt höchstens 8 Farben.
- Zoom: Ein Klick auf eine Familie (Legende oder Übersicht „Alle Laute“) zeigt ihre einzelnen Laute als Kurven. Im Zoom bekommen die Laute die Farben in ihrer Reihenfolge in der Datendatei, Rangliste und Übersicht beschränken sich auf die Familie. Die Ansicht lässt sich verlinken: `#2021/rufe` (Jahr/Familien-id).
- Jahre ohne Lieder erscheinen als Lücke (0). Unter jedem Jahr steht die Abdeckung („gezählt/alle“), damit niemand eine Lücke für „keine Laute“ hält.

## Aufbau

Statische Website ohne Server und ohne Build-Schritt. Details zu Dateien und Datenformat stehen in der [README](../README.md).

| Datei | Zweck |
|---|---|
| `index.html`, `assets/app.js` | öffentliche Seite |
| `werkstatt.html`, `assets/werkstatt.js` | Pflege: Daten laden, Kandidaten freigeben, Zählungen erfassen, Datei herunterladen |
| `assets/core.js` | gemeinsame Logik (beste Zählung, Jahre, Familien, Vorzählen), auch in den Tests genutzt |
| `assets/style.css`, `assets/fonts/` | Gestaltung; Schriften selbst gehostet (Shrikhand, Instrument Sans, JetBrains Mono, SIL OFL) |
| `daten/shalalameter-daten.json` | **die Daten**; alles, was die Seite zeigt |
| `tests/core.test.js` | 17 Tests: Zählregel, beste Zählung, Kandidaten, Familien, Gültigkeit der Datendatei |
| `tools/serve.js` | lokaler Server (`npm start`, http://localhost:8080) |
| `tools/freigabe-2026-10-16.js` | einmaliges Skript: Kandidaten freigegeben, Familien zugeordnet (Dokumentation, nicht erneut ausführen) |
| `tools/beispieldaten.js` | erzeugt erfundene Beispieldaten (nur für Tests ohne echte Daten) |
| `impressum.html`, `datenschutz.html` | Pflichtseiten, **noch mit Platzhaltern** |

## So wird gearbeitet

**Daten ändern (Normalfall)**
1. `npm start`, dann http://localhost:8080/werkstatt.html öffnen (oder die Werkstatt online).
2. Zählung erfassen, Kandidaten freigeben oder eine neue Cowork-Datei laden. Alles bleibt als Entwurf im Browser.
3. Mit „Vorschau“ prüfen, dann „Datei herunterladen“.
4. Datei nach `daten/shalalameter-daten.json` kopieren, `npm test` ausführen, committen und pushen. Nach etwa einer Minute ist die Seite aktuell.

**Familie eines Lauts ändern:** in der Datendatei beim Laut das Feld `familie` umsetzen. Familien und ihre Reihenfolge (= Farben) stehen in `familien`.

**Code ändern:** `npm test`, lokal im Browser prüfen, pushen. Node 24 ist installiert, die GitHub-CLI `gh` ist als StefanH1000 angemeldet.

## Getroffene Entscheidungen

- **Keine Liedtexte speichern oder anzeigen**, nur Zahlen und den Laut selbst als Beleg (Urheberrecht). Der Text zum Vorzählen in der Werkstatt wird nicht gespeichert.
- **Schriften selbst gehostet**, damit keine Verbindung zu Google Fonts entsteht (DSGVO). Die Seite setzt keine Cookies und nutzt kein Tracking.
- **GitHub Pages mit öffentlichem Repository**, weil das kostenlos ist. Das Repository enthält nur Zahlen und Code.
- **Lautfamilien statt 29 einzelner Kurven:** Mehr als 8 Farben sind nicht unterscheidbar. Die Einteilung stammt von Claude und ist eine inhaltliche Setzung, die das Team anpassen kann.
- **Cover, Übersetzungen und unklare Fälle** bleiben in den Daten, werden aber standardmäßig ausgeblendet.

## Offene Punkte

**Vor einer breiteren Bekanntmachung**
- [ ] **Impressum und Datenschutz ausfüllen** (Name, Anschrift, E-Mail). Die Seite ist bereits öffentlich.
- [ ] Auf dem Handy prüfen. Getestet ist nur eine Breite ab 504 px, weil Edge im Headless-Modus nicht schmaler rendert.

**Inhaltlich mit dem Fortuna-Team klären**
- [ ] **Piu piu:** steht bei 0. Weglassen, als bewusste 0 behalten oder nach Gehör nachzählen?
- [ ] **Booklet-Texte** erbitten. Das wäre die verlässlichste Grundlage und würde die Lücken 2023 (4 von 15 gezählt) und 2025 (3 von 19) schließen.
- [ ] Sind „Drei Tage Regen“ (2025) und „Drei Tage Regen Danke Scheisskerl“ (2022) dasselbe Lied?
- [ ] Gelten „Kommst Du?“, „Wer kann sich schon entscheiden“ und „Endspiel“ (Gisbert zu Knyphausen) als Cover?
- [ ] Gehört „Wissenschaft ist eine Meinung“ (Rainald Grebe feat. Fortuna Ehrenfeld) dazu?
- [ ] Gibt es Veröffentlichungen vor 2016 („Das Ende der Coolness Vol. 1“)? Cowork hat keine gefunden.
- [ ] Familieneinteilung absegnen.

Die vollständige Liste unsicherer Entscheidungen steht in Coworks `bericht.md` (liegt nicht im Repository).

**Später: Community-Zählungen (Phase 2)**
Das Datenformat ist dafür vorbereitet: Jede Zählung ist ein eigener Eintrag mit Grundlage, Quelle und Person, und die Seite wählt die verlässlichste. Es fehlen ein Einreichungsformular für Fans, ein Speicherort und eine Moderation. Vorschlag: Supabase (kostenlos, Server in der EU) mit dem Status „offen“ für Einreichungen und Freigabe durch Moderierende. Erst dann braucht das Projekt ein Backend.

**Optional**
- Eigene Domain statt `stefanh1000.github.io` (z. B. shalalameter.de).
- Vorschaubild für Social Media.

## Bekannte Einschränkungen

- **„Boom laboom“** steht bei 0. Der Laut kommt nur in einer Zweitquelle vor, die nicht als beste Zählung gewählt wird.
- **Vorzählen in der Werkstatt:** Die Muster erkennen nicht jede Schreibweise. Laute mit Kommas im Namen („Uh, uh, uh“) werden gar nicht automatisch erkannt. Das Ergebnis immer prüfen.
- Die Werkstatt ist online erreichbar, aber für Suchmaschinen gesperrt. Ein Risiko ist das nicht: Änderungen dort bleiben im jeweiligen Browser.
- In Git ist auf dem Rechner kein Name hinterlegt. Commits wurden mit „hoch“ und der Konto-E-Mail erstellt.

## Verlauf in Kürze

1. Designprototyp mit erfundenen Daten (Claude-Artifact), dann gestapelte Kurven als Einstieg.
2. Name „Fortuna Ehrenfeld Shalalameter“, Zustimmung des Fortuna-Teams.
3. Diskografie aus MusicBrainz, Auszählung durch Claude Cowork.
4. Projekt mit Tests, GitHub Pages online.
5. Echte Daten eingespielt. Dabei behoben: Gleichstand zwischen Quellen, doppelt gezählte Kandidaten, Zählmuster über Zeilenumbrüche hinweg.
6. Alle Kandidaten freigegeben, Lautfamilien und Übersicht „Alle Laute“ ergänzt.
