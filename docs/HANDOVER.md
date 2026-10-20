# Übergabe: Fortuna Ehrenfeld Schalalameter

Stand: 19.10.2026

## Worum es geht

Das Schalalameter zeigt, wie oft Fortuna Ehrenfeld lautmalerische Laute wie „Schalala“, „Da-da“ oder „Oh-oh-oh“ singen, und wie sich das über die Albumphasen verändert. Unterzeile: „Sprache von vor und nach der Sprache.“ Einstieg ist ein Diagramm mit gestapelten Kurven über zehn Albumphasen. Ein Klick auf ein Album listet die Lieder dieser Phase, sortiert nach Anzahl der Schalalas. Ein Klick auf eine Familie blendet sie ein oder aus, die Lupe daneben öffnet ihren Steckbrief. Darunter stehen die Übersicht „Alle Schalalas“ und der Abschnitt „Über das Schalalameter“.

**Schreibweise:** sichtbar immer „Schalala“, in der Bedienung heißen die Laute „Schalalas“. Repository und URL heißen seit 17.10.2026 `schalalameter` (alte Adresse ohne Weiterleitung). Interne Kennungen, Dateinamen und der lokale Ordner bleiben `shalala` / `shalalameter`. Die Texte der Seite (Unterzeile, Zählerklärung, Steckbriefe, „Über“, Schlusszeile) sind vom Projektverantwortlichen festgelegt und werden nicht umformuliert.

Das Projekt ist ein Fanprojekt. **Das Fortuna-Team ist einverstanden.** Veröffentlicht werden nur Zählungen, keine Liedtexte.

| | |
|---|---|
| Live-Seite | https://schalalameter.hoch.studio/ (Cloudflare Worker `schalalameter`, Domain in `wrangler.jsonc`); dieselbe Seite auch unter https://schalalameter.hoch.workers.dev/ und, bis das Repository privat ist, https://stefanh1000.github.io/schalalameter/ |
| Werkstatt (intern, nicht verlinkt) | https://schalalameter.hoch.studio/werkstatt (Kopfzeile `X-Robots-Tag: noindex`) |
| Repository | https://github.com/StefanH1000/schalalameter (öffentlich, Branch `main`) |
| Hosting | Cloudflare (Worker mit statischen Dateien), baut bei jedem Push auf `main`: Deploy-Befehl `npx wrangler deploy`, der vorher selbst `npm run build` ausführt (nur `dist/`, siehe `wrangler.jsonc`, `_headers`) |
| Lokaler Ordner | `C:\Users\hoch\shalalameter` |

## Stand der Daten

Grundlage ist eine Auszählung durch Claude Cowork vom 16.10.2026, nur nach online verfügbaren Liedtexten (Shazam/Apple, sonichits.com/LyricFind, songtexte.com, lyricstranslate.com).

- **169 Lieder** nach Bereinigung: jedes Lied nur einmal, im Jahr seiner Erstveröffentlichung. Live-Fassungen und Radio Edits sind zusammengeführt.
- Davon 145 eigene Lieder, 11 französische Übersetzungen, 10 Cover und 3 unklare Fälle. Die Startseite und „Zähl mit“ zeigen nur eigene Lieder; die Filterzeile (Liedtypen, Sicherheit, Refrains ausgeschrieben) gibt es seit 17.10.2026 nicht mehr. Die Werkstatt sieht weiterhin alle.
- Seit 17.10.2026 dazu 11 Lieder von „Revolution!“ (2026) (Startseite jetzt 156 eigene Lieder). Sie sind nach der Plattenbeilage der LP gezählt (Grundlage `booklet`), 10 von 11; „Göppingen“ steht nicht im Booklet, vermutlich instrumental. Keiner der bisherigen Laute kommt darin vor, dafür fünf neue, freigegeben am 17.10.2026: Dub-di-dub-di-dubb (5× in „Ausflug in den Club“), Kuruu-kuruu und Ram-tam-tam (je 1× in „Rabenflügel“), Tatütata (1× in „Cognac für die Huren“, als Nomen, aber reine Lautmalerei), alle in Täterätätä im Pyjama; Fiki hey (1× in „Die Polyintensiven“) in Daseinslaute. Nicht gezählt: „ey“, „Hurra“, „Halleluja“ (stehen als Wörter).
- Ebenfalls am 17.10.2026 nach Plattenbeilage gezählt: alle 12 Lieder von „Live at the Hollywood Bowl“ und 11 von „Das Ende der Coolness Vol. 2“ (Seite 4 der Textbeilage, das Titellied fehlt). Abweichungen zum Online-Text: „Alles explodiert“ bumm 9→3, kawumm 3→1, olé 3→1 (die Plattenbeilage druckt den Block nur einmal; danach abgehört: bumm 7, kawumm 2, olé 1 wie in der Plattenbeilage, gilt nach der Regel „Gehör vor Plattenbeilage“); „Life at the Hollywood Bowl“ hey hey hey 2→0, dafür 1× „uuuuh“, gezählt als Uh, uh, uh; „Ciao Kakao“ whoopie whoopie 4→3; „Internet zerf*cken“ neu 3× Uh, uh, uh. Gezählt wird, was im Booklet steht, auch wenn gesungen öfter wiederholt wird.
- **115 von 180 Liedern gezählt** (Stand Datendatei 17.10.2026, ohne Fanzählungen): 33 nach Plattenbeilage (Revolution!, Live at the Hollywood Bowl, Das Ende der Coolness Vol. 2), 1 nach Gehör („Alles explodiert“), 81 nach Online-Text. 65 ohne Zählung. Es fehlen fast das ganze Album „Himmelerdenblau“ (2025), alle französischen Fassungen, elf Titel von „Glitzerschwein“ und „Göppingen“ (Revolution!, ohne Text im Booklet).
- **38 Laute in 7 Familien**, alle freigegeben (Pa-pa-pa und Duh-dudu am 18.10.2026, Klapp und Juppidupiduh am 19.10.2026 aus Fanvorschlägen; Summen unten aus der Datendatei, ohne Fanzählungen):

| Familie (Anzeigename) | Untertitel | Laute | Summe (eigene Lieder) |
|---|---|---|---|
| Spatzenlaser | Piu piu | Piu piu | 0 |
| Schalalamente | Schalala | Schalala | 51 |
| Silbenhack | La la, Da da und Co | Da-da, Lalala, Ba-ba-ba, Da-da-da, Ladi dadi dai, Lo-lo-lo, Nanana, Pa-pa-pa | 73 |
| Rummse | Bumm und Kawumm | Bumm, Kawumm, Boom laboom, Klapp | 10 |
| DNA Elemente eines erfüllten Lebens | Oh, Ah, Uh | Ah-ah-oh-ah-ah, Oh-oh-oh, Ah-uh, Ah-ah, Mh-mh-mh-hm, Ah-ah-ah, Uh, uh, uh | 51 |
| Täterätätä im Pyjama | Dudeln und Tröten | Dum-didi-dum, Tä-tä-rä-tä-tä, Fuzzi fuzzi fuzz, Humpe täterää, Dudeldudeldudel, Dub-di-dub-di-dubb, Kuruu-kuruu, Ram-tam-tam, Tatütata, Duh-dudu | 24 |
| Daseinslaute | Hey, Yeah, Olé | Whoopie whoopie, Yeah yeah yeah, Olé, Hey hey hey, Hooray hooray, Fiki hey, Juppidupiduh | 10 |

Jede Familie hat in der Datendatei `id` (fest), `name` (bisheriger Name, für die Werkstatt), `anzeigename`, `untertitel` und `steckbrief`.

Auffällig: Schalala hat seinen Gipfel 2021 (30, davon 16 in „Arschloch, Wixer, Hurensohn!“). 2019 ragt durch 48× „Da-da“ in „Sanktpankpaul“ heraus. **Piu piu kommt in keinem Online-Text vor.**

## Regeln, die in den Zahlen stecken

**Zählregel** (auf der Seite: „Gezählt wird, was kein Wort mehr schafft.“)
- Eine Lautfolge zählt einmal: „piu piu piu“ = 1.
- Komma und Zeilenumbruch trennen Lautfolgen: „schalala, schalala“ = 2.
- Das Vorzählen erkennt Shalala, Schalala, Sha la la und Scha la la als denselben Laut.
- Gezählt wird, was im Text steht. Wo ein Text nur „(2x)“ oder „Refrain“ enthält, kann eine aufgelöste Zahl in `anzahl_aufgeloest` stehen. Die Startseite nutzt sie nicht mehr (der Filter „Refrains ausgeschrieben“ ist entfernt); die Daten bleiben für später erhalten.
- Ein Laut im Liedtitel zählt nicht.

**Welche Zählung gilt, wenn es mehrere gibt** (`bestOf` in `assets/core.js`), in dieser Reihenfolge:
1. Grundlage: Gehör (Werkstatt) und Fankonsens gleichrangig vor Plattenbeilage vor Online-Text; bei Gleichstand der Fankonsens, der die Gehör-Zählung als Stimme enthält. Abgehört ist verlässlicher als die Plattenbeilage, die Wiederholungen oft nur einmal abdruckt und Ausrufe weglässt (Gehör vor Plattenbeilage seit 17.10.2026, Beispiel „Alles explodiert“; Fankonsens vor Plattenbeilage seit 20.10.2026, Beispiel „Die Polyintensiven“).
2. Sicherheit: hoch vor mittel vor niedrig.
3. Quellenart: offiziell vor lizenziert vor Community.
4. Mehr Laute: zuerst feste Laute, dann notierte Kandidaten. Online-Texte kürzen Laute eher weg, als dass sie welche erfinden.
5. Die neueste Zählung.

Neue Laute (Kandidaten) zählen nur aus der jeweils besten Zählung, sonst würden sie bei mehreren Quellen doppelt gezählt.

**Fanzählungen** (Supabase, Region Frankfurt)

- Seite `zaehlen.html` („Zähl mit“): Unter 900 px Breite vier Schritte nacheinander (Lied, Schalala, Mitzählen, Prüfen und Abschicken; die Zurück-Taste des Handys geht einen Schritt zurück), ab 900 px drei Spalten nebeneinander. Nur eigene Lieder, mit Suche und Filter „Noch ohne Zählung / Alle“ (dazu ein Album über `?album=<id>`), nach Album mit Cover; Laute als farbige Knöpfe je Familie, dazu „Neuen Laut vorschlagen“; Mitzählen per großem Knopf oder Leertaste, „Einen zurück“, „Von vorn“, „Kommt nicht vor (0)“; Grundlage Gehör oder Plattenbeilage, Spitzname (im Browser gemerkt), zufällige Geräte-Kennung, unsichtbares Feld gegen Bots. Vorauswahl per `zaehlen.html?lied=…`. Der aktuelle Stand erscheint erst nach dem Absenden, danach „Noch ein Schalala in diesem Lied“ oder „Nächstes Lied ohne Zählung“. Entwurf: Design-Canvas https://claude.ai/artifact/5865AiNyciG9iNHs33QLHA.
- Konsens je Lied und Laut: Laute mit Fanstimmen: Die Fans zählen, dazu als erste Stimme die beste Zählung der Datendatei, wenn sie nach Gehör (Werkstatt) ist oder, solange es keine Plattenbeilage gibt, nach Onlinetext; eine Plattenbeilage stimmt nicht mit, Fans gehen ihr vor (Plattenbeilagen lassen Ausrufe oft weg, Beispiel „Die Polyintensiven“: Plattenbeilage Fiki hey 1, Fans Whoopie whoopie 4). Unter 3 Stimmen gilt der Durchschnitt, aufgerundet; ab 3 der häufigste Wert, bei Gleichstand der Median aller Stimmen, aufgerundet. Laute ohne Fanstimme behalten den besten Wert der Datendatei, auch aus der Plattenbeilage. Unbekannte Lied- oder Laut-IDs zählen nicht. Rangfolge in `bestOf` (seit 20.10.2026): „nach Gehör“ (Werkstatt) und Fankonsens gleichrangig vor Plattenbeilage vor Onlinetext; bei Gleichstand gewinnt der Fankonsens, weil er die Gehör-Zählung als Stimme enthält.
- Die Startseite zeigt „aus N Fanzählungen“ am Lied und „aus n“ am Laut, sobald der Fankonsens die angezeigte Zählung ist.
- Datenbank (`supabase/tabelle.sql`): Tabelle `fan_zaehlungen` mit RLS und ohne Policies; anon darf nur `zaehlung_einreichen` ausführen (prüft, ersetzt je Gerät, Lied und Laut, höchstens 30 je Gerät und Stunde) und die Ansicht `fan_zaehlungen_oeffentlich` lesen (ohne geraet_id und spitzname, ohne gesperrte). Ein Vorschlag hat eine leere laut_id und den Laut als Text in `vorschlag`; ein Gerät kann mehrere Vorschläge je Lied machen, derselbe Text (ohne Groß-/Kleinschreibung) ersetzt den früheren.
- „Keine Schalalas in diesem Lied“ (Schritt 2, unter den Lauten): eine Einreichung mit `laut_id = 'keine'` und Anzahl 0 (`SM.KEINE`). Im Fankonsens ist sie eine Stimme 0 für jeden Laut des Lieds, zählt aber als eine Fanzählung. Das Lied gilt danach als gezählt und steht unter „Ohne Schalalas“. Ein echter Laut darf deshalb nie die ID `keine` bekommen.
- Familienfrage (seit 19.10.2026): Ein neuer Laut in „Zähl mit“ braucht eine Familie oder „Weiß nicht“. Beim ersten Vorschlag legt `zaehlung_einreichen` über `familienfrage` ein Forumsthema der Art `familie` an (Titel „Neuer Laut „…“: Welche Familie?“, eins je `laut_schluessel`), die Wahl zählt als Stimme des Geräts und lässt sich in „Zähl mit“ oder im Forum ändern. Antworten aus der Tabelle `familien` (in `tabelle.sql` gepflegt; kommt eine Familie dazu, dort ergänzen und das Skript neu ausführen). Werkstatt: „Als Laut anlegen“ mit Familienauswahl, die häufigste Familie vorgewählt; `SM.approveCandidate(data, text, '__neu', familie)`.
- Zuletzt gezählt (seit 19.10.2026): Kasten unter dem Diagramm mit den zehn neuesten Fanzählungen (`SM.zuletztGezaehlt`), nur eigene Lieder und freigegebene Laute, ohne Nullzählungen einzelner Laute (gefiltert vor dem Begrenzen; im Fankonsens zählen sie weiter), „Keine Schalalas“ als „keine Schalalas gefunden“, gleiches Lied und gleicher Spitzname als ein Eintrag mit allen Lauten (ohne Spitzname nicht zusammengefasst), ohne ausgeblendete Spitznamen; fehlt ohne Supabase.
- Spitznamen sind öffentlich (seit 17.10.2026): am Lied „aus N Fanzählungen, gezählt von Kalle, Taube und 2 weiteren“, auf der Danke-Seite „Du bist nach Kalle die zweite Stimme“ bzw. „Auch Kalle hat „Peng peng“ gehört“. Die Ansicht gibt `spitzname` aus, außer bei `name_ausgeblendet = true` (Spalte im Table Editor; die Zählung bleibt). Ohne die Spalte in der Datenbank lädt `fans.js` die Zählungen ohne Namen.
- Sperren: Table Editor, Spalte `gesperrt` auf true, oder `update public.fan_zaehlungen set gesperrt = true where id = …;`. Gesperrte Einträge bleiben auch bei erneuter Einreichung gesperrt.
- Neue Laute: Fans schlagen sie mit Anzahl vor. Sie werden gespeichert, erscheinen aber auf der Seite erst nach der Freigabe. Die Werkstatt zeigt offene Vorschläge als Kandidaten, „Als Laut anlegen“ übernimmt sie in den Entwurf; nach dem Einspielen der Datendatei zählen alle Vorschläge mit gleichem Text (Name, ID oder Feld `aliase` des Lauts, verglichen ohne Groß-/Kleinschreibung und Satzzeichen) als Stimmen für diesen Laut. Eine Onlinezählung, die den Laut nicht kennt, ist dabei keine Stimme. Bekannte Lücke: Wer erst vorschlägt und nach der Freigabe denselben Laut im selben Lied noch einmal zählt, hat zwei Stimmen.
- Datenschutz: Abschnitt zu Supabase. Der Vertrag zur Auftragsverarbeitung (DPA) ist Teil der Nutzungsbedingungen von Supabase und gilt ohne eigene Unterschrift (Organization settings → Legal Documents → View DPA); die Seite verweist auf Art. 28 DSGVO.

**Schalalalogie** (seit 17.10.2026, Seite `schalalalogie.html`, „Fachschaftsforum zum Haarespalten und Jauchzen“)
- Ohne Anmeldung: Liedthemen (eins je Lied, entsteht beim ersten Beitrag, `#lied/<lied-id>`), freie Themen, Abstimmungen (2 bis 6 Antworten, optionales Enddatum, eine Stimme je Gerät, änderbar solange offen). Spitzname und Geräte-Kennung wie bei „Zähl mit“ (gemeinsam in `fans.js`).
- Beiträge bis 2.000 Zeichen, nie als HTML ausgegeben: `SM.textMitLinks` maskiert alles und macht nur http(s)-Adressen zu Links (`rel="nofollow ugc noopener"`, `target="_blank"`). Regeln über jedem Formular (freundlich bleiben, keine kompletten Liedtexte, Fortuna-Team und Fans respektieren).
- „Melden“ in zwei Schritten; der Beitrag bleibt sichtbar und steht in der Werkstatt in der Prüfliste.
- Verlinkt: Startseite (Knopf neben „Zähl mit“, Fußzeile), an jedem Lied „Diskussion (N)“, nach dem Absenden in „Zähl mit“ „Über dieses Lied fachsimpeln“.
- Datenbank in `supabase/tabelle.sql`: Tabellen `themen`, `beitraege`, `antworten`, `stimmen`, `meldungen`, Funktionen `thema_anlegen`, `beitrag_schreiben`, `abstimmen`, `melden`, Ansichten `*_oeffentlich` ohne geraet_id und ohne Gesperrtes. Grenzwerte in der Tabelle `grenzwerte` (30 Zählungen, 30 Beiträge, 10 Themen, 30 Meldungen je Gerät und Stunde).
- Moderation: Werkstatt, Bereich „Schalalalogie · Moderation“, Anmeldung mit E-Mail und Passwort (Supabase Auth, Token nur im Tab). Darf, wer in `public.moderation` steht: Prüfliste, sperren/freigeben (Beiträge, Themen, Zählungen), Spitznamen ausblenden, Abstimmungen schließen. Durchgesetzt über RLS-Policies und Spaltenrechte; Löschen gibt es über die Data API nicht. Einrichtung in der README unter „Moderation“.
- Ist Supabase nicht erreichbar: Startseite zeigt nach höchstens 3 Sekunden die Datendatei, Schalalalogie und „Zähl mit“ melden, dass die Verbindung gerade nicht klappt.

**Albumphasen** (`phaseInfo` in `assets/core.js`)

Die x-Achse zeigt zehn Albumphasen in Erscheinungsreihenfolge, gleichmäßig verteilt (nicht nach Datum skaliert): Coolness (2016), Hey Sexy (2017), Helm ab (2019), Rückkehr (2021), Solo I. (2022), Glitzerschwein (2023), Universum (2024), Himmelerdenblau (2025), Hollywood Bowl (2026, gilt als Studioalbum), Revolution! (2026, neuestes Album; Vinyl-LP bei Tonproduktion Records, TPR069; genaues Datum unbekannt, deshalb `datum: "2026"`). Keine eigenen Phasen: „Debout pour ma prière“ (Übersetzungsalbum), „Das letzte Kommando“, „Solo Live“, „Solo Live im St. Pauli Theater“ (Livealben). Die Alben stehen in der Datendatei unter `alben` (id, titel, kurz, datum, reihenfolge).

Zuordnung eines Lieds, in dieser Reihenfolge:
1. Überschreibung im Feld `phase` des Lieds gewinnt immer.
2. Übersetzung: Phase des Originals über `original_id`.
3. Lied steht auf einem Studioalbum (`veroeffentlichung` „Titel (Album)“ oder `auch_auf` „Titel (Datum)“): dieses Album, bei mehreren das zuerst erschienene. Beispiel: „Brüsseler Platz“ → Solo I.
4. Sonst das Album mit dem geringsten Abstand in Tagen zur Erstveröffentlichung (18 Lieder, darunter „Arsch am Meer“, „Wilde Jahre“, Live-Erstveröffentlichungen). Gleichstände gibt es derzeit keine.

Gespeicherte Überschreibungen: Helm ab zum Gebet für „Trust Me, I'm an Alien!“ und die Regenradar-EP (Drückerkolonne, Bella Ciao, Die ewige Sabine, Hossegor, Hooray Hooray, Vereinsheim; die EP erschien einen Tag vor dem Album); Die Rückkehr zur Normalität für „Weltuntergang“ (nach Regel 4 läge Helm ab knapp näher, 378 zu 385 Tage). Alle übrigen Phasen werden berechnet, nicht gespeichert.

Eigene Lieder je Phase (alle/gezählt): Coolness 12/11, Hey Sexy 13/13, Helm ab 21/18, Rückkehr 11/10, Solo I. 15/11, Glitzerschwein 15/4, Universum 30/26, Himmelerdenblau 16/0, Hollywood Bowl 12/12, Revolution! 11/10. In der Vorgabe standen Helm ab 21/17 und Rückkehr 11/11. Die Daten ergeben eindeutig 18 und 10: In Helm ab fehlt der Text nur bei „Hör endlich auf zu jammern“, „Faire Tapisserie“ und „Pluie, movement“; in Rückkehr hat „Weltuntergang“ keinen Text.

**Darstellung**
- Die Farbe folgt der Familie in fester Reihenfolge, nie dem Rang. Es gibt höchstens 8 Farben.
- Überall stehen die Laute einer Familie groß (Feld `untertitel`, z. B. „Oh, Ah, Uh“) und der Familienname klein darunter (`anzeigename`), auch im Steckbrief und an den Kurven.
- Familien-Chips sind zweiteilig: Ein Klick auf den Chip blendet die Familie ein oder aus (mindestens eine bleibt sichtbar, „Alle zeigen“ setzt zurück). Die y-Achse passt sich den eingeblendeten Familien an.
- Die Lupe (am Chip und in der Übersicht „Alle Schalalas“) öffnet unter dem Hauptdiagramm das Detail: Steckbrief, Summe im aktuellen Filter, die drei Lieder mit den meisten Treffern (je Lied die Schalalas dieser Familie mit Anzahl, z. B. „Ah-ah-oh-ah-ah 15 · Ah-ah 5“) und kleine Kurven je Laut, alle in der Familienfarbe und im selben Maßstab. Das Hauptdiagramm bleibt stehen. Bei offenem Detail zählt die Rangliste nur die Laute dieser Familie.
- Lange Namen brechen um, sie werden nie gekürzt.
- Verlinkbar: `#rueckkehr` (Phase), `#rueckkehr/rufe` (Detail offen), `#rueckkehr/-/piu,silben` (ohne Detail, zwei Familien ausgeblendet). Alte Links mit Jahreszahl (`#2021`) führen zum Album dieses Jahres.
- Die Achse zeigt die Albumcover (`assets/cover/<id>.jpg`, oder Feld `cover` beim Album), das gewählte umrandet. Albumname, Jahr und Abdeckung („x von y Liedern gezählt“) stehen im Tooltip und in der Phasenansicht, nicht an der Achse. Fehlt ein Cover, erscheint bei großen Covern der Kurzname.
- Cover: aus dem Cover Art Archive (MusicBrainz), 250 px, Rechte bei Band und Label; Verwendung vom Projektverantwortlichen freigegeben. Ausnahme: Das Cover von „Revolution!“ ist ein eigenes Foto des Projektverantwortlichen.
- Die Liedliste einer Phase zeigt bei jedem Lied das Erscheinungsjahr. Die Übersicht „Alle Schalalas“ ist nach Phasen gegliedert.
- Umschalter über dem Hauptdiagramm (seit 17.10.2026): „Absolut“ (Anzahl Schalalas) oder „Relativ“ (je Album ergeben die eingeblendeten Familien 100 %, die Kurven sind überall gleich hoch). Der Tooltip zeigt relativ Prozent und in Klammern die Anzahl. Alben ohne gezählte Schalalas fallen relativ auf 0 (derzeit Himmelerdenblau). Die Wahl merkt sich der Browser, sie steht nicht in der Adresse. Liederliste, Steckbrief und „Alle Schalalas“ bleiben absolut.
- Absolute Zahlen, keine Normierung pro Lied. Den Umschalter „Ø je Lied“ gibt es nicht mehr (17.10.2026): Bei lückenhaften Phasen war auch der Durchschnitt verzerrt, und er machte die Seite schwerer verständlich.
- Zähl mit auf der Startseite: Knopf neben dem Introtext mit der Zahl offener eigener Lieder; unter dem Diagramm „Hier fehlen noch Zählungen“ für jede Albumphase, in der weniger als die Hälfte der gezeigten Lieder gezählt ist, mit Link `zaehlen.html?album=<id>`; auf dem Handy ein fester Knopf unten, sobald der obere aus dem Bild ist.
- Oberzeile: „Piu piu, Schalala & Co. · Lautmalerei in 10 Jahren Fortuna Ehrenfeld“.

## Aufbau

Statische Website ohne Server und ohne Build-Schritt. Details zu Dateien und Datenformat stehen in der [README](../README.md).

| Datei | Zweck |
|---|---|
| `index.html`, `assets/app.js` | öffentliche Seite |
| `werkstatt.html`, `assets/werkstatt.js` | Pflege: Daten laden, Kandidaten freigeben, Zählungen erfassen, Albumphase pro Lied ansehen und überschreiben, Datei herunterladen |
| `assets/core.js` | gemeinsame Logik (beste Zählung, Albumphasen, Familien, Vorzählen), auch in den Tests genutzt |
| `assets/style.css`, `assets/fonts/` | Gestaltung; Schriften selbst gehostet (Shrikhand, Instrument Sans; JetBrains Mono nur für Code-Felder, SIL OFL) |
| `daten/shalalameter-daten.json` | **die Daten**; alles, was die Seite zeigt |
| `tests/core.test.js` | 44 Tests: Familienfrage (Familien in SQL und Datendatei gleich, Lautschlüssel SQL wie JS, Auswertung, Freigabe mit Familie), „Zuletzt gezählt“ (Filter, Zusammenfassen, zehn Einträge), Liedreihenfolge mit Tracknummern, „Keine Schalalas“, Spitznamen, sichere Ausgabe von Beitragstexten mit Links, Konsensregel und Fankonsens, Zählregel, beide Schreibweisen, beste Zählung, Kandidaten, Familien mit Texten, kein „Shalala“ in sichtbaren Texten, alle vier Phasenregeln, Überschreibungen, jedes Lied in genau einer Phase, Gültigkeit der Datendatei |
| `tools/alben-2026-10-16.js` | einmaliges Skript: Alben und Phasen-Überschreibungen angelegt (Dokumentation, nicht erneut ausführen) |
| `tools/booklet-revolution-2026-10-17.js` | einmaliges Skript: Zählungen nach der Plattenbeilage für „Revolution!“ (Dokumentation, nicht erneut ausführen) |
| `tools/sprache-2026-10-16.js` | einmaliges Skript: Schreibweise „Schalala“, Anzeigenamen, Untertitel, Steckbriefe (Dokumentation, nicht erneut ausführen) |
| `zaehlen.html`, `assets/zaehlen.js` | Formular „Zähl mit“ für Fanzählungen |
| `schalalalogie.html`, `assets/schalalalogie.js` | Schalalalogie (Forum) |
| `assets/moderation.js` | Werkstatt, Bereich Moderation |
| `assets/fans.js`, `assets/supabase-config.js` | Zugriff auf Supabase per fetch (ohne Bibliothek), Anmeldung der Moderation, Geräte-Kennung und Spitzname; Adresse und öffentlicher Schlüssel |
| `supabase/tabelle.sql` | Tabellen, Funktionen, Ansichten, Policies und Grenzwerte für Zählungen, Schalalalogie und Moderation; im SQL Editor ausführen (wiederholbar) |
| `tools/serve.js` | lokaler Server (`npm start`, http://localhost:8080) |
| `tools/freigabe-2026-10-16.js` | einmaliges Skript: Kandidaten freigegeben, Familien zugeordnet (Dokumentation, nicht erneut ausführen) |
| `tools/booklet-hollywood-coolness-2026-10-17.js` | einmaliges Skript: Zählungen nach der Plattenbeilage für Hollywood Bowl und Coolness (Dokumentation, nicht erneut ausführen) |
| `tools/gehoert-2026-10-17.js` | einmaliges Skript: abgehörte Zählung „Alles explodiert“, „uuuuh“ zu Uh, uh, uh (Dokumentation, nicht erneut ausführen) |
| `tools/freigabe-2026-10-17.js` | einmaliges Skript: die fünf neuen Laute aus „Revolution!“ freigegeben (Dokumentation, nicht erneut ausführen) |
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
- **Cloudflare statt GitHub Pages** (19.10.2026), damit das Repository privat sein kann; GitHub Pages ist im kostenlosen Plan nur mit öffentlichem Repository möglich. Ausgeliefert wird nur `dist/`, Dokumentation, SQL, Werkzeuge und Tests bleiben privat.
- **Lautfamilien statt 29 einzelner Kurven:** Mehr als 8 Farben sind nicht unterscheidbar. Die Einteilung stammt von Claude und ist eine inhaltliche Setzung, die das Team anpassen kann.
- **Cover, Übersetzungen und unklare Fälle** bleiben in den Daten, werden auf der Seite aber nicht gezeigt.

## Offene Punkte

**Vor einer breiteren Bekanntmachung**
- [x] Impressum und Datenschutz ausgefüllt (Stefan Hoch, Anschrift, E-Mail; die Adresse ist im Quelltext gegen Adresssammler verschleiert und nicht klickbar).
- [ ] Auf einem echten Handy ansehen. Geprüft ist eine 360 px breite Ansicht im Browser: kein waagrechtes Scrollen, auch nicht im Steckbrief mit dem langen Familiennamen.

**Inhaltlich mit dem Fortuna-Team klären**
- [ ] **Piu piu:** steht bei 0. Weglassen, als bewusste 0 behalten oder nach Gehör nachzählen?
- [ ] **Texte der Plattenbeilagen** erbitten. Das wäre die verlässlichste Grundlage und würde die Lücken Glitzerschwein (4 von 15 eigenen Liedern gezählt) und Himmelerdenblau (0 von 16, Stand Datendatei ohne Fanzählungen) schließen.
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
- [ ] `tabelle.sql` nach dem Stand vom 19.10.2026 (Familienfrage) im SQL Editor ausführen und mit `select id, text from public.familien order by position;` prüfen.
- [ ] Nach einer echten Einreichung in der Tabelle `aufrufe` nachsehen, ob Zeilen mit `ip:` entstehen (sonst kommt die IP-Adresse nicht an und es greifen nur die Grenzen je Gerät und insgesamt).

**Schalalalogie**
- [x] `supabase/tabelle.sql` neu im SQL Editor ausgeführt (17.10.2026).
- [ ] Authentication: „Allow new users to sign up“ aus; Moderationskonto anlegen und in `public.moderation` eintragen.
- [x] Meldeadresse im Impressum eingetragen (dieselbe E-Mail wie unter Kontakt, gegen Adresssammler verschleiert).
- [ ] Nachweise gegen das echte Projekt mit curl (lokal mit PGlite und einem nachgebauten PostgREST geprüft, siehe Verlauf).

**Optional**
- [x] Eigene Domain: schalalameter.hoch.studio (Domain hoch.studio bei Cloudflare, 19.10.2026).
- Vorschaubild für Social Media.

## Sicherheit

Stand 18.10.2026, nach einem Sicherheitscheck durch Codex (nur lesend; keine kritischen Befunde, keine XSS, keine Geheimnisse im Repository oder in der Historie, Moderation sauber getrennt).

- **Ratenbegrenzung** (`aufruf_zaehlen` in `supabase/tabelle.sql`): Jeder Aufruf von `zaehlung_einreichen`, `thema_anlegen`, `beitrag_schreiben`, `abstimmen` und `melden` zählt, auch das Ändern einer bestehenden Zählung, und zwar je Gerät, je IP-Adresse und insgesamt je Stunde. Die Grenzen stehen in der Tabelle `grenzwerte` (`*_je_stunde`, `*_je_ip_stunde`, `*_gesamt_stunde`). Das Hochzählen ist atomar (`insert … on conflict` sperrt die Zählerzeile). Die IP stammt aus den Kopfzeilen der Data API (`cf-connecting-ip`, ersatzweise `x-real-ip`, `x-forwarded-for`) und wird nur als gesalzener MD5-Hash im Schlüssel der Tabelle `aufrufe` abgelegt; Einträge älter als drei Stunden werden gelöscht. Das Salz liegt in `geheimnis`. Kontrolle nach einer echten Einreichung: In `aufrufe` sollten Schlüssel mit `geraet:`, `ip:` und `alle:` stehen. Fehlt `ip:`, kommen die Kopfzeilen nicht an, dann greifen nur Gerät und Gesamt.
- **Grenzen der Ratenbegrenzung:** Wer viele IP-Adressen hat, kann weiterhin manipulieren, bis die Gesamtgrenze greift. Ein CAPTCHA bräuchte einen eigenen Server (Edge Function) und ist für das Fanprojekt bewusst nicht umgesetzt.
- **Öffentliche Rechte:** `anon` darf die fünf Schreibfunktionen ausführen und die vier `*_oeffentlich`-Ansichten lesen, sonst nichts. Das Forum gehört ausdrücklich dazu.
- **Content-Security-Policy** als `<meta>` auf allen sechs Seiten: nur eigene Skripte, Bilder und Schriften, Datenabruf nur von hier und vom Supabase-Projekt. Inline-Styles sind erlaubt, Inline-Skripte und `on…`-Attribute nicht. **Ändert sich die Supabase-Adresse, muss sie auch in der CSP aller HTML-Seiten geändert werden.**
- **Testserver** (`tools/serve.js`): nur `127.0.0.1`, keine versteckten Dateien (`.git` …), echte Prüfung der Verzeichnisgrenze.
- **Git-Historie:** Commit `07c3dbc` enthält ein versehentlich committetes, leeres Chrome-Testprofil (`assets/cover/p6`, in `fc32a1d` entfernt). Laut Codex keine Zugangsdaten, Cookies oder Verlauf darin. Bewusst nicht aus der Historie entfernt.

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
10. Album „Revolution!“ (2026) ergänzt: 11 neue Lieder, noch ohne Zählung. Der zwölfte Titel, „Nudeln mit Tomatensoße“, stand schon auf Universum (2024); dort ist Revolution! unter `auch_auf` vermerkt, das Lied bleibt in der Phase Universum. Danach nach der Plattenbeilage gezählt, Cover durch ein eigenes Foto ersetzt, fünf neue Laute freigegeben.
11. Schalalalogie (Forum) und Moderation in der Werkstatt; Grenzwerte in einer Tabelle. SQL lokal in PGlite geprüft (leeres Projekt, Wiederholung, 66 Rechteprüfungen), Seiten mit einem nachgebauten PostgREST im Browser (26 Prüfungen, auch 360 px und ohne Supabase).
12. Familienfrage für neue Laute (Themenart `familie`, Tabelle `familien`) und „Zuletzt gezählt“ auf der Startseite. SQL in PGlite geprüft (Aktualisierung vom alten Stand mit Daten, Wiederholung, Neuinstallation, Familienfrage, Rechte; 44 Prüfungen), Seiten im Browser mit nachgeahmtem Supabase, auch mit noch altem Datenbankstand und bei 360 px.
