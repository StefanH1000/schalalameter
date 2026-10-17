-- Schalalameter: Fanzählungen
-- Im Supabase SQL Editor ausführen (Schema public). Bei Änderungen einfach erneut ausführen, vorhandene Einträge bleiben.
-- Grundhaltung: Die Rolle anon (öffentlicher Schlüssel der Website) darf genau zwei Dinge:
--   1. die Funktion zaehlung_einreichen ausführen,
--   2. die Ansicht fan_zaehlungen_oeffentlich lesen.
-- Alles andere bleibt gesperrt. Das Skript ist wiederholbar (if not exists / or replace).

-- ---------------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------------
create table if not exists public.fan_zaehlungen (
  id           bigint generated always as identity primary key,
  lied_id      text        not null check (lied_id ~ '^[a-z0-9-]{1,120}$'),
  -- Laut aus der Datendatei; leer, wenn ein neuer Laut vorgeschlagen wird.
  laut_id      text        not null default '' check (laut_id = '' or laut_id ~ '^[a-z0-9-]{1,120}$'),
  anzahl       smallint    not null check (anzahl between 0 and 200),
  -- Freitext für einen neuen Laut, sonst leer.
  vorschlag    text        not null default '' check (char_length(vorschlag) <= 60),
  spitzname    text        not null check (char_length(spitzname) between 1 and 40),
  grundlage    text        not null check (grundlage in ('gehoert', 'booklet')),
  geraet_id    uuid        not null,
  erstellt     timestamptz not null default now(),
  aktualisiert timestamptz not null default now(),
  gesperrt     boolean     not null default false,
  -- Genau eins von beiden: ein bekannter Laut oder ein Vorschlag.
  constraint laut_oder_vorschlag check ((laut_id <> '') <> (vorschlag <> ''))
);

-- Eine neue Einreichung desselben Geräts für dasselbe Lied und denselben Laut ersetzt die alte.
-- Vorschläge unterscheiden sich am Text (ohne Groß-/Kleinschreibung), so kann ein Gerät mehrere neue Laute
-- im selben Lied vorschlagen. Die frühere Einschränkung ohne Vorschlagstext wird bei Wiederholung ersetzt.
alter table public.fan_zaehlungen drop constraint if exists eine_zaehlung_je_geraet;
create unique index if not exists fan_zaehlungen_eindeutig
  on public.fan_zaehlungen (geraet_id, lied_id, laut_id, lower(vorschlag));

create index if not exists fan_zaehlungen_geraet_zeit on public.fan_zaehlungen (geraet_id, aktualisiert);

-- RLS an und keine einzige Policy: Über die Data API kommt niemand direkt an die Zeilen,
-- auch dann nicht, wenn versehentlich eine Tabellenfreigabe erteilt würde.
alter table public.fan_zaehlungen enable row level security;

-- Tabellenrechte für die öffentlichen Rollen ausdrücklich entziehen:
-- anon und authenticated dürfen die Tabelle weder lesen noch schreiben, ändern oder löschen.
revoke all on table public.fan_zaehlungen from anon, authenticated, public;
revoke all on sequence public.fan_zaehlungen_id_seq from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- Einreichen: nur über diese Funktion
-- ---------------------------------------------------------------------------
-- security definer: läuft mit den Rechten des Eigentümers (postgres) und darf deshalb schreiben,
-- obwohl anon selbst keine Tabellenrechte hat. Sie prüft alle Eingaben, ersetzt eine frühere
-- Einreichung desselben Geräts (gleiches Lied, gleicher Laut bzw. gleicher Vorschlag) und lässt höchstens 30 Einreichungen je Gerät und Stunde zu.
-- Gesperrte Einträge bleiben gesperrt, auch wenn das Gerät erneut einreicht.
create or replace function public.zaehlung_einreichen(
  p_lied_id   text,
  p_laut_id   text,
  p_anzahl    integer,
  p_vorschlag text,
  p_spitzname text,
  p_grundlage text,
  p_geraet_id uuid
) returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_laut      text := coalesce(btrim(p_laut_id), '');
  v_vorschlag text := coalesce(btrim(p_vorschlag), '');
  v_name      text := coalesce(btrim(p_spitzname), '');
  v_anzahl_h  integer;
begin
  if p_geraet_id is null then
    raise exception 'Geräte-Kennung fehlt' using errcode = '22023';
  end if;
  if p_lied_id is null or p_lied_id !~ '^[a-z0-9-]{1,120}$' then
    raise exception 'Unbekanntes Lied' using errcode = '22023';
  end if;
  if (v_laut = '') = (v_vorschlag = '') then
    raise exception 'Bitte einen Laut wählen oder einen neuen vorschlagen' using errcode = '22023';
  end if;
  if v_laut <> '' and v_laut !~ '^[a-z0-9-]{1,120}$' then
    raise exception 'Unbekannter Laut' using errcode = '22023';
  end if;
  if char_length(v_vorschlag) > 60 then
    raise exception 'Vorschlag zu lang (höchstens 60 Zeichen)' using errcode = '22023';
  end if;
  if p_anzahl is null or p_anzahl < 0 or p_anzahl > 200 then
    raise exception 'Anzahl muss zwischen 0 und 200 liegen' using errcode = '22023';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'Spitzname muss 1 bis 40 Zeichen haben' using errcode = '22023';
  end if;
  if p_grundlage is null or p_grundlage not in ('gehoert', 'booklet') then
    raise exception 'Grundlage muss gehört oder Booklet sein' using errcode = '22023';
  end if;

  -- Ratenbegrenzung: Einreichungen dieses Geräts in der letzten Stunde.
  select count(*) into v_anzahl_h
    from public.fan_zaehlungen
   where geraet_id = p_geraet_id
     and aktualisiert > now() - interval '1 hour';
  if v_anzahl_h >= 30 then
    raise exception 'Zu viele Einreichungen in kurzer Zeit, bitte später weiterzählen' using errcode = 'P0001';
  end if;

  insert into public.fan_zaehlungen (lied_id, laut_id, anzahl, vorschlag, spitzname, grundlage, geraet_id)
  values (p_lied_id, v_laut, p_anzahl, v_vorschlag, v_name, p_grundlage, p_geraet_id)
  on conflict (geraet_id, lied_id, laut_id, lower(vorschlag)) do update
    set anzahl       = excluded.anzahl,
        vorschlag    = excluded.vorschlag,
        spitzname    = excluded.spitzname,
        grundlage    = excluded.grundlage,
        aktualisiert = now();

  return json_build_object('ok', true);
end;
$$;

-- Ausführen darf die Funktion nur anon (die Website). Standardmäßig hätte jede Rolle das Recht,
-- deshalb zuerst allen entziehen.
revoke all on function public.zaehlung_einreichen(text, text, integer, text, text, text, uuid) from public, authenticated;
grant execute on function public.zaehlung_einreichen(text, text, integer, text, text, text, uuid) to anon;

-- ---------------------------------------------------------------------------
-- Lesen: nur über diese Ansicht
-- ---------------------------------------------------------------------------
-- Die Ansicht läuft mit den Rechten ihres Eigentümers (security_invoker = false) und liest deshalb
-- die Tabelle, obwohl anon dort nichts darf. Sie enthält weder geraet_id noch spitzname
-- und lässt gesperrte Einträge aus.
create or replace view public.fan_zaehlungen_oeffentlich
with (security_invoker = false) as
select lied_id, laut_id, anzahl, vorschlag, grundlage, aktualisiert
  from public.fan_zaehlungen
 where not gesperrt;

-- anon darf die Ansicht lesen, sonst nichts an ihr; authenticated bekommt nichts.
revoke all on table public.fan_zaehlungen_oeffentlich from anon, authenticated, public;
grant select on table public.fan_zaehlungen_oeffentlich to anon;

-- ---------------------------------------------------------------------------
-- Einen Eintrag sperren (im SQL Editor oder im Table Editor, Spalte gesperrt = true):
--   update public.fan_zaehlungen set gesperrt = true where id = 123;
-- Alle Einträge eines Spitznamens sperren:
--   update public.fan_zaehlungen set gesperrt = true where spitzname = 'Beispiel';
-- ---------------------------------------------------------------------------
