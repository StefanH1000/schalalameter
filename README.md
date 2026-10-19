# Fortuna Ehrenfeld Schalalameter

*Sprache von vor und nach der Sprache.*

Wie oft singen Fortuna Ehrenfeld „piu piu“, „schalala“ und Co.? Die Seite zeigt die Laute aller Lieder als gestapelte Kurven über die zehn Albumphasen, wahlweise absolut oder relativ (je Album 100 %). Ein Klick auf ein Album listet dessen Lieder, sortiert nach Anzahl der Laute. Dazu kommen „Zähl mit“ für Fanzählungen und die Schalalalogie, ein Forum.

Statische Website ohne Server und ohne Build-Schritt. Gespeichert werden nur Zählungen, keine Liedtexte.

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html`, `assets/app.js` | öffentliche Seite |
| `werkstatt.html`, `assets/werkstatt.js` | interne Pflege: Daten laden, neue Laute freigeben, Zählungen erfassen |
| `assets/core.js` | gemeinsame Logik (beste Zählung, Fankonsens, Albumphasen, Familien, sichere Beitragstexte, Muster fürs Vorzählen) |
| `zaehlen.html`, `assets/zaehlen.js` | „Zähl mit“: Fanzählungen einreichen |
| `schalalalogie.html`, `assets/schalalalogie.js` | Schalalalogie: Forum mit Liedthemen, freien Themen und Abstimmungen |
| `assets/moderation.js` | Werkstatt, Bereich Moderation (Anmeldung über Supabase Auth) |
| `assets/fans.js`, `assets/supabase-config.js` | Zugriff auf Supabase per fetch (ohne Bibliothek); Adresse und öffentlicher Schlüssel |
| `supabase/tabelle.sql` | Tabellen, Funktionen, Ansichten, Rechte und Grenzwerte; im SQL Editor ausführen |
| `daten/shalalameter-daten.json` | **die Daten**, Format siehe unten |
| `impressum.html`, `datenschutz.html` | Pflichtseiten; mit Kontaktadresse für Meldungen rechtswidriger Inhalte |
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

**Reihenfolge der Lieder** (`SM.liedOrdnung`, überall gleich): nach Albumphase, darin zuerst die Lieder des Albums nach `track` (Position auf dem Album, aus MusicBrainz, Revolution! aus Discogs), danach die übrigen der Phase zugeordneten Lieder nach Erscheinungsdatum. Steht ein Lied auf mehreren Alben, gilt die Position auf dem Album seiner Phase. Bei einem neuen Album die Tracknummern mit eintragen.

### Fanzählungen (Supabase)

Über `zaehlen.html` („Zähl mit“, verlinkt auf der Startseite und an jedem Lied) reichen Fans ohne Anmeldung eine Zählung für ein Lied und einen Laut ein, oder schlagen einen neuen Laut vor. Die Einreichungen liegen in Supabase; die Startseite lädt sie beim Öffnen (höchstens 3 Sekunden, sonst nur die Datendatei) und rechnet sie ein. Die Datendatei bleibt unverändert.

Konsens je Lied und Laut (`consensus` und `fanZaehlungen` in `assets/core.js`): Die bisherige beste Zählung aus der Datendatei (ohne Booklet) zählt als erste Stimme. Unter 3 Stimmen gilt der Durchschnitt, aufgerundet; ab 3 der häufigste Wert, bei Gleichstand der Median aller Stimmen, aufgerundet. Laute ohne Fanstimme behalten den Wert der Datendatei. Unbekannte Lied- oder Laut-IDs zählen nicht. Rangfolge in `bestOf`: „nach Gehör“ (Werkstatt) vor Booklet vor Fankonsens vor Onlinetext.

Einrichtung: `supabase/tabelle.sql` im SQL Editor ausführen (wiederholbar, vorhandene Einträge bleiben), dann Projektadresse und öffentlichen Schlüssel (anon oder publishable, nie service_role) in `assets/supabase-config.js` eintragen. Die Rolle anon darf nur die Funktionen ausführen und die Ansichten lesen; die Zählansicht `fan_zaehlungen_oeffentlich` enthält keine Geräte-Kennung und lässt gesperrte Einträge aus.

**Neue Laute und Familienfrage:** Wer in „Zähl mit“ einen neuen Laut vorschlägt, wählt dazu eine Familie oder „Weiß nicht“ (Spalte `familie` in `fan_zaehlungen`). `zaehlung_einreichen` legt beim ersten Vorschlag dieses Lauts in der Schalalalogie eine Familienfrage an (Themenart `familie`, eine je `laut_schluessel`; gleicher Text ohne Groß-/Kleinschreibung und Satzzeichen landet im selben Thema) und zählt die gewählte Familie als Stimme dieses Geräts. Die Antworten kommen aus der Tabelle `familien` in `tabelle.sql`, die zu den Familien der Datendatei passen muss (ein Test prüft das). Die Danke-Seite verlinkt auf die Frage. In der Werkstatt zeigt „Als Laut anlegen“ die Familien mit Stimmen und wählt die häufigste vor („Weiß nicht“ zählt dabei nicht). Kennt die Datenbank `p_familie` noch nicht, reicht `fans.js` ohne Familie ein.

**Zuletzt gezählt:** Unter dem Diagramm der Startseite die zehn neuesten Fanzählungen (`SM.zuletztGezaehlt`): Lied (führt zur Albumphase), Laut mit Anzahl oder „Keine Schalalas“, Spitzname, Datum. Nur eigene Lieder und freigegebene Laute; gesperrte Einträge liefert die Ansicht nicht, ausgeblendete Spitznamen fehlen. Ohne Supabase oder ohne Zählungen bleibt der Kasten weg.

Sperren: in der Werkstatt unter „Schalalalogie · Moderation“ (nach Anmeldung), im Table Editor (Spalte `gesperrt`) oder im SQL Editor `update public.fan_zaehlungen set gesperrt = true where id = 123;`. Gesperrte Einträge verschwinden sofort aus der Ansicht und damit von der Seite.

### Schalalalogie (Forum)

`schalalalogie.html`, „Fachschaftsforum zum Haarespalten und Jauchzen“, ohne Anmeldung nutzbar. Drei Arten von Themen: Liedthemen (eins je Lied, entsteht beim ersten Beitrag, Adresse `schalalalogie.html#lied/<lied-id>`), freie Themen (Titel und erster Beitrag) und Abstimmungen (Frage, 2 bis 6 Antworten, optionales Enddatum; eine Stimme je Gerät, änderbar, solange offen). Dazu kommen Familienfragen zu vorgeschlagenen Lauten: Sie entstehen nur aus „Zähl mit“, haben alle Familien und „Weiß nicht“ als Antworten (ohne Grenze von 6) und stehen im Filter „Abstimmungen“; abgestimmt wird wie bei Abstimmungen, die Moderation kann sie schließen. Beiträge bis 2.000 Zeichen; Ausgabe nur als Text über `SM.textMitLinks` (alles maskiert, http(s)-Adressen als Links mit `rel="nofollow ugc noopener"` und `target="_blank"`, keine Bilder). „Melden“ an jedem Beitrag; gemeldete Beiträge bleiben sichtbar und stehen in der Werkstatt in der Prüfliste.

Datenbank: Tabellen `themen`, `beitraege`, `antworten`, `stimmen`, `meldungen`; Schreiben nur über die Funktionen `thema_anlegen`, `beitrag_schreiben`, `abstimmen`, `melden`; Lesen nur über `themen_oeffentlich`, `beitraege_oeffentlich`, `antworten_oeffentlich` (ohne Geräte-Kennung, ohne Gesperrtes).

Grenzwerte stehen an einer Stelle, in der Tabelle `grenzwerte` (Standard: 30 Zählungen, 30 Beiträge, 10 neue Themen und 30 Meldungen je Gerät und Stunde). Ändern im Table Editor oder mit `update public.grenzwerte set wert = 50 where name = 'beitraege_je_stunde';`. Ein erneutes Ausführen von `tabelle.sql` überschreibt geänderte Werte nicht.

### Moderation

1. In Supabase unter Authentication → Sign In / Providers „Allow new users to sign up“ ausschalten (keine Selbstregistrierung).
2. Authentication → Users → „Add user“: E-Mail, Passwort, „Auto Confirm User“.
3. Im SQL Editor: `insert into public.moderation (user_id, name) values ('<User UID>', 'Name');`
4. In der Werkstatt unter „Schalalalogie · Moderation“ anmelden. Dort: Prüfliste gemeldeter Beiträge, Beiträge, Themen und Fanzählungen sperren und freigeben, Spitznamen ausblenden, Abstimmungen schließen.

Die Rechte setzt die Datenbank durch: Angemeldete dürfen nur lesen und die Spalten `gesperrt`, `geschlossen`, `name_ausgeblendet` und `erledigt` ändern, und nur, wenn ihre Nutzer-ID in `moderation` steht. Löschen geht über die Data API gar nicht. Im Browser liegt nur das Zugangstoken der angemeldeten Person (für den Tab), nie ein service_role-Schlüssel.

Pro Lied kann es mehrere Zählungen geben. Angezeigt wird die verlässlichste: Gehör vor Booklet vor Fankonsens vor Online-Text, dann Sicherheit, Quellenart, mehr Laute, dann die neueste.

Zählregel: Gezählt wird, was kein Wort mehr schafft. Eine Lautfolge zählt einmal („piu piu piu“ = 1). Komma und Zeilenumbruch trennen Lautfolgen („schalala, schalala“ = 2). Das Vorzählen erkennt beide Schreibweisen (Shalala, Schalala, Sha la la, Scha la la) als denselben Laut.

Schreibweise: sichtbar immer „Schalala“. Repository und URL heißen `schalalameter` (https://stefanh1000.github.io/schalalameter/), interne Kennungen und Dateinamen weiter `shalala` bzw. `shalalameter`.

## Schriften

Shrikhand, Instrument Sans und JetBrains Mono, selbst gehostet (SIL Open Font License), damit keine Verbindung zu Google Fonts entsteht.
