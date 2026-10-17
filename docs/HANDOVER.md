# Übergabe: Fortuna Ehrenfeld Schalalameter

Stand: 17.10.2026

## Worum es geht

Das Schalalameter zeigt, wie oft Fortuna Ehrenfeld lautmalerische Laute wie „Schalala“, „Da-da“ oder „Oh-oh-oh“ singen, und wie sich das über die Albumphasen verändert. Unterzeile: „Sprache von vor und nach der Sprache.“ Einstieg ist ein Diagramm mit gestapelten Kurven über neun Albumphasen. Ein Klick auf ein Album listet die Lieder dieser Phase, sortiert nach Anzahl der Schalalas. Ein Klick auf eine Familie blendet sie ein oder aus, die Lupe daneben öffnet ihren Steckbrief. Darunter stehen die Übersicht „Alle Schalalas“ und der Abschnitt „Über das Schalalameter“.

**Schreibweise:** sichtbar immer „Schalala“, in der Bedienung heißen die Laute „Schalalas“. Interne Kennungen, Dateinamen, Repository und URL bleiben `shalala` / `shalalameter`. Die Texte der Seite (Unterzeile, Zählerklärung, Steckbriefe, „Über“, Schlusszeile) sind vom Projektverantwortlichen festgelegt und werden nicht umformuliert.

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

| Familie (Anzeigename) | Untertitel | Laute | Summe (eigene Lieder) |
|---|---|---|---|
| Spatzenlaser | Piu piu | Piu piu | 0 |
| Schalalamente | Schalala | Schalala | 51 |
| Silbenhack | La la, Da da und Co | Da-da, Lalala, Ba-ba-ba, Da-da-da, Ladi dadi dai, Lo-lo-lo, Nanana | 73 |
| Rummse | Bumm und Kawumm | Bumm, Kawumm, Boom laboom | 13 |
| DNA Elemente eines erfüllten Lebens | Oh, Ah, Uh | Ah-ah-oh-ah-ah, Oh-oh-oh, Ah-uh, Ah-ah, Mh-mh-mh-hm, Ah-ah-ah, Uh, uh, uh | 47 |
| Täterätätä im Pyjama | Dudeln und Tröten | Dum-didi-dum, Tä-tä-rä-tä-tä, Fuzzi fuzzi fuzz, Humpe täterää, Dudeldudeldudel | 16 |
| Daseinslaute | Hey, Yeah, Olé | Whoopie whoopie, Yeah yeah yeah, Olé, Hey hey hey, Hooray hooray | 14 |

Jede Familie hat in der Datendatei `id` (fest), `name` (bisheriger Name, für die Werkstatt), `anzeigename`, `untertitel` und `steckbrief`.

Auffällig: Schalala hat seinen Gipfel 2021 (30, davon 16 in „Arschloch, Wixer, Hurensohn!“). 2019 ragt durch 48× „Da-da“ in „Sanktpankpaul“ heraus. **Piu piu kommt in keinem Online-Text vor.**

## Regeln, die in den Zahlen stecken

**Zählregel** (auf der Seite: „Gezählt wird, was kein Wort mehr schafft.“)
- Eine Lautfolge zählt einmal: „piu piu piu“ = 1.
- Komma und Zeilenumbruch trennen Lautfolgen: „schalala, schalala“ = 2.
- Das Vorzählen erkennt Shalala, Schalala, Sha la la und Scha la la als denselben Laut.
- Gezählt wird, was im Text steht. Wo ein Text nur „(2x)“ oder „Refrain“ enthält, kann eine aufgelöste Zahl in `anzahl_aufgeloest` stehen. Die Seite nutzt sie nur, wenn der Filter „Refrains ausgeschrieben“ aktiv ist.
- Ein Laut im Liedtitel zählt nicht.

**Welche Zählung gilt, wenn es mehrere gibt** (`bestOf` in `assets/core.js`), in dieser Reihenfolge:
1. Grundlage: Booklet vor Gehör vor Online-Text.
2. Sicherheit: hoch vor mittel vor niedrig.
3. Quellenart: offiziell vor lizenziert vor Community.
4. Mehr Laute: zuerst feste Laute, dann notierte Kandidaten. Online-Texte kürzen Laute eher weg, als dass sie welche erfinden.
5. Die neueste Zählung.

Neue Laute (Kandidaten) zählen nur aus der jeweils besten Zählung, sonst würden sie bei mehreren Quellen doppelt gezählt.

**Fanzählungen** (Supabase, Region Frankfurt)

- Seite `zaehlen.html` („Zähl mit“): Unter 900 px Breite vier Schritte nacheinander (Lied, Schalala, Mitzählen, Prüfen und Abschicken; die Zurück-Taste des Handys geht einen Schritt zurück), ab 900 px drei Spalten nebeneinander. Lieder mit Suche und Filter „Noch ohne Zählung / Alle“, nach Album mit Cover; Laute als farbige Knöpfe je Familie, dazu „Neuen Laut vorschlagen“; Mitzählen per großem Knopf oder Leertaste, „Einen zurück“, „Von vorn“, „Kommt nicht vor (0)“; Grundlage Gehör oder Booklet, Spitzname (im Browser gemerkt), zufällige Geräte-Kennung, unsichtbares Feld gegen Bots. Vorauswahl per `zaehlen.html?lied=…`. Der aktuelle Stand erscheint erst nach dem Absenden, danach „Noch ein Schalala in diesem Lied“ oder „Nächstes Lied ohne Zählung“. Entwurf: Design-Canvas https://claude.ai/artifact/5865AiNyciG9iNHs33QLHA.
- Konsens je Lied und Laut: Die bisherige beste Zählung aus der Datendatei (Onlinetext) ist die erste Stimme. Unter 3 Stimmen Durchschnitt aufgerundet, ab 3 der häufigste Wert, bei Gleichstand Median aufgerundet. Laute ohne Fanstimme behalten den Wert der Datendatei, ohne Datendatei-Zählung 0. Rangfolge in `bestOf`: Booklet vor Fankonsens vor „nach Gehör“ (Werkstatt) vor Onlinetext.
- Die Startseite zeigt „aus N Fanzählungen“ am Lied und „aus n“ am Laut, sobald der Fankonsens die angezeigte Zählung ist.
- Datenbank (`supabase/tabelle.sql`): Tabelle `fan_zaehlungen` mit RLS und ohne Policies; anon darf nur `zaehlung_einreichen` ausführen (prüft, ersetzt je Gerät, Lied und Laut, höchstens 30 je Gerät und Stunde) und die Ansicht `fan_zaehlungen_oeffentlich` lesen (ohne geraet_id und spitzname, ohne gesperrte). Ein Vorschlag hat eine leere laut_id und den Laut als Text in `vorschlag`; ein Gerät kann mehrere Vorschläge je Lied machen, derselbe Text (ohne Groß-/Kleinschreibung) ersetzt den früheren.
- Sperren: Table Editor, Spalte `gesperrt` auf true, oder `update public.fan_zaehlungen set gesperrt = true where id = …;`. Gesperrte Einträge bleiben auch bei erneuter Einreichung gesperrt.
- Neue Laute: Fans schlagen sie mit Anzahl vor. Sie werden gespeichert, erscheinen aber auf der Seite erst nach der Freigabe. Die Werkstatt zeigt offene Vorschläge als Kandidaten, „Als Laut anlegen“ übernimmt sie in den Entwurf; nach dem Einspielen der Datendatei zählen alle Vorschläge mit gleichem Text (Name, ID oder Feld `aliase` des Lauts, verglichen ohne Groß-/Kleinschreibung und Satzzeichen) als Stimmen für diesen Laut. Eine Onlinezählung, die den Laut nicht kennt, ist dabei keine Stimme. Bekannte Lücke: Wer erst vorschlägt und nach der Freigabe denselben Laut im selben Lied noch einmal zählt, hat zwei Stimmen.
- Datenschutz: Abschnitt zu Supabase. Der Vertrag zur Auftragsverarbeitung (DPA) ist Teil der Nutzungsbedingungen von Supabase und gilt ohne eigene Unterschrift (Organization settings → Legal Documents → View DPA); die Seite verweist auf Art. 28 DSGVO.

**Albumphasen** (`phaseInfo` in `assets/core.js`)

Die x-Achse zeigt neun Albumphasen in Erscheinungsreihenfolge, gleichmäßig verteilt (nicht nach Datum skaliert): Coolness (2016), Hey Sexy (2017), Helm ab (2019), Rückkehr (2021), Solo I. (2022), Glitzerschwein (2023), Universum (2024), Himmelerdenblau (2025), Hollywood Bowl (2026, gilt als Studioalbum). Keine eigenen Phasen: „Debout pour ma prière“ (Übersetzungsalbum), „Das letzte Kommando“, „Solo Live“, „Solo Live im St. Pauli Theater“ (Livealben). Die Alben stehen in der Datendatei unter `alben` (id, titel, kurz, datum, reihenfolge).

Zuordnung eines Lieds, in dieser Reihenfolge:
1. Überschreibung im Feld `phase` des Lieds gewinnt immer.
2. Übersetzung: Phase des Originals über `original_id`.
3. Lied steht auf einem Studioalbum (`veroeffentlichung` „Titel (Album)“ oder `auch_auf` „Titel (Datum)“): dieses Album, bei mehreren das zuerst erschienene. Beispiel: „Brüsseler Platz“ → Solo I.
4. Sonst das Album mit dem geringsten Abstand in Tagen zur Erstveröffentlichung (18 Lieder, darunter „Arsch am Meer“, „Wilde Jahre“, Live-Erstveröffentlichungen). Gleichstände gibt es derzeit keine.

Gespeicherte Überschreibungen: Helm ab zum Gebet für „Trust Me, I'm an Alien!“ und die Regenradar-EP (Drückerkolonne, Bella Ciao, Die ewige Sabine, Hossegor, Hooray Hooray, Vereinsheim; die EP erschien einen Tag vor dem Album); Die Rückkehr zur Normalität für „Weltuntergang“ (nach Regel 4 läge Helm ab knapp näher, 378 zu 385 Tage). Alle übrigen Phasen werden berechnet, nicht gespeichert.

Eigene Lieder je Phase (alle/gezählt): Coolness 12/11, Hey Sexy 13/13, Helm ab 21/18, Rückkehr 11/10, Solo I. 15/11, Glitzerschwein 15/4, Universum 30/26, Himmelerdenblau 16/0, Hollywood Bowl 12/12. In der Vorgabe standen Helm ab 21/17 und Rückkehr 11/11. Die Daten ergeben eindeutig 18 und 10: In Helm ab fehlt der Text nur bei „Hör endlich auf zu jammern“, „Faire Tapisserie“ und „Pluie, movement“; in Rückkehr hat „Weltuntergang“ keinen Text.

**Darstellung**
- Die Farbe folgt der Familie in fester Reihenfolge, nie dem Rang. Es gibt höchstens 8 Farben.
- Überall stehen die Laute einer Familie groß (Feld `untertitel`, z. B. „Oh, Ah, Uh“) und der Familienname klein darunter (`anzeigename`), auch im Steckbrief und an den Kurven.
- Familien-Chips sind zweiteilig: Ein Klick auf den Chip blendet die Familie ein oder aus (mindestens eine bleibt sichtbar, „Alle zeigen“ setzt zurück). Die y-Achse passt sich den eingeblendeten Familien an.
- Die Lupe (am Chip und in der Übersicht „Alle Schalalas“) öffnet unter dem Hauptdiagramm das Detail: Steckbrief, Summe im aktuellen Filter, die drei Lieder mit den meisten Treffern (je Lied die Schalalas dieser Familie mit Anzahl, z. B. „Ah-ah-oh-ah-ah 15 · Ah-ah 5“) und kleine Kurven je Laut, alle in der Familienfarbe und im selben Maßstab. Das Hauptdiagramm bleibt stehen. Bei offenem Detail zählt die Rangliste nur die Laute dieser Familie.
- Lange Namen brechen um, sie werden nie gekürzt.
- Verlinkbar: `#rueckkehr` (Phase), `#rueckkehr/rufe` (Detail offen), `#rueckkehr/-/piu,silben` (ohne Detail, zwei Familien ausgeblendet). Alte Links mit Jahreszahl (`#2021`) führen zum Album dieses Jahres.
- Die Achse zeigt die Albumcover (`assets/cover/<id>.jpg`, oder Feld `cover` beim Album), das gewählte umrandet. Albumname, Jahr und Abdeckung („x von y Liedern gezählt“) stehen im Tooltip und in der Phasenansicht, nicht an der Achse. Fehlt ein Cover, erscheint bei großen Covern der Kurzname.
- Cover: aus dem Cover Art Archive (MusicBrainz), 250 px, Rechte bei Band und Label; Verwendung vom Projektverantwortlichen freigegeben.
- Die Liedliste einer Phase zeigt bei jedem Lied das Erscheinungsjahr. Die Übersicht „Alle Schalalas“ ist nach Phasen gegliedert.
- Absolute Zahlen, keine Normierung pro Lied (außer im Umschalter „Ø je Lied“).

## Aufbau

Statische Website ohne Server und ohne Build-Schritt. Details zu Dateien und Datenformat stehen in der [README](../README.md).

| Datei | Zweck |
|---|---|
| `index.html`, `assets/app.js` | öffentliche Seite |
| `werkstatt.html`, `assets/werkstatt.js` | Pflege: Daten laden, Kandidaten freigeben, Zählungen erfassen, Albumphase pro Lied ansehen und überschreiben, Datei herunterladen |
| `assets/core.js` | gemeinsame Logik (beste Zählung, Albumphasen, Familien, Vorzählen), auch in den Tests genutzt |
| `assets/style.css`, `assets/fonts/` | Gestaltung; Schriften selbst gehostet (Shrikhand, Instrument Sans; JetBrains Mono nur für Code-Felder, SIL OFL) |
| `daten/shalalameter-daten.json` | **die Daten**; alles, was die Seite zeigt |
| `tests/core.test.js` | 32 Tests: Konsensregel und Fankonsens, Zählregel, beide Schreibweisen, beste Zählung, Kandidaten, Familien mit Texten, kein „Shalala“ in sichtbaren Texten, alle vier Phasenregeln, Überschreibungen, jedes Lied in genau einer Phase, Gültigkeit der Datendatei |
| `tools/alben-2026-10-16.js` | einmaliges Skript: Alben und Phasen-Überschreibungen angelegt (Dokumentation, nicht erneut ausführen) |
| `tools/sprache-2026-10-16.js` | einmaliges Skript: Schreibweise „Schalala“, Anzeigenamen, Untertitel, Steckbriefe (Dokumentation, nicht erneut ausführen) |
| `zaehlen.html`, `assets/zaehlen.js` | Formular „Zähl mit“ für Fanzählungen |
| `assets/fans.js`, `assets/supabase-config.js` | Zugriff auf Supabase per fetch (ohne Bibliothek); Adresse und öffentlicher Schlüssel |
| `supabase/tabelle.sql` | Tabelle, Funktion, Ansicht und Freigaben; einmal im SQL Editor ausführen |
| `tools/serve.js` | lokaler Server (`npm start`, http://localhost:8080) |
| `tools/freigabe-2026-10-16.js` | einmaliges Skript: Kandidaten freigegeben, Familien zugeordnet (Dokumentation, nicht erneut ausführen) |
| `tools/beispieldaten.js` | erzeugt erfundene Beispieldaten (nur für Tests ohne echte Daten) |
| `impressum.html`, `datenschutz.html` | Pflichtseiten, minimal ausgefüllt (Stefan Hoch) |

## So wird gearbeitet

**Daten ändern (Normalfall)**
1. `npm start`, dann http://localhost:8080/werkstatt.html öffnen (oder die Werkstatt online).
2. Zählung erfassen, Kandidaten freigeben oder eine neue Cowork-Datei laden. Alles bleibt als Entwurf im Browser.
3. Mit „Vorschau“ prüfen, dann „Datei herunterladen“.
4. Datei nach `daten/shalalameter-daten.json` kopieren, `npm test` ausführen, committen und pushen. Nach etwa einer Minute ist die Seite aktuell.

**Familie eines Lauts ändern:** in der Datendatei beim Laut das Feld `familie` umsetzen. Familien und ihre Reihenfolge (= Farben) stehen in `familien`.

**Code ändern:** `npm test`, lokal im Browser prüfen, `npm run cachebust`, pushen. Der letzte Schritt setzt eine neue Versionsnummer an CSS und JS (`?v=…`); ohne ihn arbeiten Browser bis zu 10 Minuten mit alten Dateien aus dem Cache weiter und die Seite kann „Die Daten konnten nicht geladen werden“ melden. Node 24 ist installiert, die GitHub-CLI `gh` ist als StefanH1000 angemeldet.

## Getroffene Entscheidungen

- **Keine Liedtexte speichern oder anzeigen**, nur Zahlen und den Laut selbst als Beleg (Urheberrecht). Der Text zum Vorzählen in der Werkstatt wird nicht gespeichert.
- **Schriften selbst gehostet**, damit keine Verbindung zu Google Fonts entsteht (DSGVO). Die Seite setzt keine Cookies und nutzt kein Tracking.
- **GitHub Pages mit öffentlichem Repository**, weil das kostenlos ist. Das Repository enthält nur Zahlen und Code.
- **Lautfamilien statt 29 einzelner Kurven:** Mehr als 8 Farben sind nicht unterscheidbar. Die Einteilung stammt von Claude und ist eine inhaltliche Setzung, die das Team anpassen kann.
- **Cover, Übersetzungen und unklare Fälle** bleiben in den Daten, werden aber standardmäßig ausgeblendet.

## Offene Punkte

**Vor einer breiteren Bekanntmachung**
- [x] Impressum und Datenschutz ausgefüllt (Stefan Hoch, Anschrift, E-Mail; die Adresse ist im Quelltext gegen Adresssammler verschleiert und nicht klickbar).
- [ ] Auf einem echten Handy ansehen. Geprüft ist eine 360 px breite Ansicht im Browser: kein waagrechtes Scrollen, auch nicht im Steckbrief mit dem langen Familiennamen.

**Inhaltlich mit dem Fortuna-Team klären**
- [ ] **Piu piu:** steht bei 0. Weglassen, als bewusste 0 behalten oder nach Gehör nachzählen?
- [ ] **Booklet-Texte** erbitten. Das wäre die verlässlichste Grundlage und würde die Lücken 2023 (4 von 15 gezählt) und 2025 (3 von 19) schließen.
- [ ] Sind „Drei Tage Regen“ (2025) und „Drei Tage Regen Danke Scheisskerl“ (2022) dasselbe Lied?
- [ ] Gelten „Kommst Du?“, „Wer kann sich schon entscheiden“ und „Endspiel“ (Gisbert zu Knyphausen) als Cover?
- [ ] Gehört „Wissenschaft ist eine Meinung“ (Rainald Grebe feat. Fortuna Ehrenfeld) dazu?
- [ ] Gibt es Veröffentlichungen vor 2016 („Das Ende der Coolness Vol. 1“)? Cowork hat keine gefunden.
- [ ] Familieneinteilung absegnen (die Namen und Steckbriefe stehen fest, die Zuordnung der Laute stammt von Claude).

Die vollständige Liste unsicherer Entscheidungen steht in Coworks `bericht.md` (liegt nicht im Repository).

**Fanzählungen (Phase 2)**
- [x] Supabase-Projekt `hyzgqwujbarpofctptmm` (Frankfurt) eingerichtet, `tabelle.sql` ausgeführt, Adresse und publishable key in `assets/supabase-config.js`. Zugriffsrechte am 17.10.2026 geprüft: Einreichen und Ansicht gehen, direkter Zugriff auf die Tabelle wird verweigert.
- [x] Vertrag zur Auftragsverarbeitung (DPA): bei Supabase Teil der Nutzungsbedingungen, keine eigene Unterschrift nötig.
- [ ] Formular auf dem Handy durchprobieren.

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
2. Name „Fortuna Ehrenfeld Shalalameter“ (seit Schritt 7 „Schalalameter“), Zustimmung des Fortuna-Teams.
3. Diskografie aus MusicBrainz, Auszählung durch Claude Cowork.
4. Projekt mit Tests, GitHub Pages online.
5. Echte Daten eingespielt. Dabei behoben: Gleichstand zwischen Quellen, doppelt gezählte Kandidaten, Zählmuster über Zeilenumbrüche hinweg.
6. Alle Kandidaten freigegeben, Lautfamilien und Übersicht „Alle Laute“ ergänzt, Zoom in Familien (später ersetzt durch Ein/Aus und Lupe mit Detail).
7. Endgültige Sprache: „Schalala“, Unterzeile, Familiennamen mit Steckbriefen, „Über das Schalalameter“, Schlusszeile „Laute gegen die Schwerkraft.“
8. Familien ein/aus und Lupe mit Detail; Achse von Jahren auf neun Albumphasen umgestellt (Zuordnung in vier Regeln, acht Überschreibungen).
9. Fanzählungen: Formular „Zähl mit“, Konsens aus Fanstimmen, Supabase als Speicher.
