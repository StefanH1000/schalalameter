-- Schalalameter: Fanzählungen, Schalalalogie (Forum) und Moderation
-- Im Supabase SQL Editor ausführen (Schema public). Bei Änderungen einfach erneut ausführen, vorhandene Einträge bleiben.
-- Das Skript ist wiederholbar (if not exists / or replace / drop policy if exists).
--
-- Grundhaltung:
--   anon (öffentlicher Schlüssel der Website) darf nur die Funktionen ausführen und die Ansichten lesen:
--     zaehlung_einreichen, thema_anlegen, beitrag_schreiben, abstimmen, melden
--     fan_zaehlungen_oeffentlich, themen_oeffentlich, beitraege_oeffentlich, antworten_oeffentlich
--   In den Tabellen selbst darf anon nichts lesen, ändern oder löschen.
--   authenticated (angemeldet über Supabase Auth) darf Tabellen nur lesen und sperren/freigeben,
--   wenn die eigene Nutzer-ID in der Tabelle moderation steht (Policies ganz unten).
--
-- Vorher in Supabase: Authentication → Sign In / Providers → „Allow new users to sign up“ AUS.
-- Moderationskonto: Authentication → Users → Add user (E-Mail, Passwort, „Auto Confirm User“), dann
--   insert into public.moderation (user_id, name) values ('<User UID>', 'Stefan');

-- ===========================================================================
-- Grenzwerte: alle Ratenbegrenzungen an einer Stelle
-- ===========================================================================
-- Anpassen im Table Editor (Tabelle grenzwerte, Spalte wert) oder per SQL, z. B.:
--   update public.grenzwerte set wert = 50 where name = 'zaehlungen_je_stunde';
-- Ein erneutes Ausführen dieses Skripts überschreibt geänderte Werte nicht.
create table if not exists public.grenzwerte (
  name      text primary key,
  wert      integer not null check (wert >= 0),
  bedeutung text not null default ''
);
insert into public.grenzwerte (name, wert, bedeutung) values
  ('zaehlungen_je_stunde', 30, 'Einreichungen je Gerät und Stunde (Zähl mit)'),
  ('beitraege_je_stunde',  30, 'Beiträge je Gerät und Stunde (Schalalalogie)'),
  ('themen_je_stunde',     10, 'Neue Themen je Gerät und Stunde, Liedthemen und Abstimmungen eingeschlossen'),
  ('meldungen_je_stunde',  30, 'Meldungen je Gerät und Stunde'),
  ('stimmen_je_stunde',    30, 'Abstimmungsaufrufe je Gerät und Stunde'),
  -- Je IP-Adresse großzügiger als je Gerät: Auf einem Konzert teilen sich viele Fans ein WLAN.
  ('zaehlungen_je_ip_stunde', 150, 'Einreichungen je IP-Adresse und Stunde'),
  ('beitraege_je_ip_stunde',   60, 'Beiträge und neue Themen je IP-Adresse und Stunde'),
  ('meldungen_je_ip_stunde',   60, 'Meldungen je IP-Adresse und Stunde'),
  ('stimmen_je_ip_stunde',    150, 'Abstimmungsaufrufe je IP-Adresse und Stunde'),
  -- Notbremse gegen Fluten mit wechselnden Geräten und Adressen.
  ('zaehlungen_gesamt_stunde', 2000, 'Einreichungen insgesamt je Stunde'),
  ('beitraege_gesamt_stunde',   400, 'Beiträge und neue Themen insgesamt je Stunde'),
  ('meldungen_gesamt_stunde',   400, 'Meldungen insgesamt je Stunde'),
  ('stimmen_gesamt_stunde',    2000, 'Abstimmungsaufrufe insgesamt je Stunde')
on conflict (name) do nothing;
alter table public.grenzwerte enable row level security;
revoke all on table public.grenzwerte from anon, authenticated, public;

-- Liest einen Grenzwert; fehlt er, gilt der Ersatzwert.
create or replace function public.grenze(p_name text, p_ersatz integer)
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select wert from public.grenzwerte where name = p_name), p_ersatz);
$$;
revoke all on function public.grenze(text, integer) from public, anon, authenticated;

-- ===========================================================================
-- Aufrufzähler: jede schreibende Anfrage zählt, je Gerät, je IP-Adresse und insgesamt
-- ===========================================================================
-- Zählt Aufrufe, nicht Zeilen: Auch das wiederholte Ändern derselben Zählung verbraucht Kontingent.
-- Die IP-Adresse wird nicht gespeichert, nur ein gesalzener Hash im Schlüssel. Einträge älter als
-- drei Stunden werden laufend gelöscht.
create table if not exists public.aufrufe (
  schluessel text        not null,
  stunde     timestamptz not null,
  anzahl     integer     not null default 0,
  primary key (schluessel, stunde)
);
alter table public.aufrufe enable row level security;
revoke all on table public.aufrufe from anon, authenticated, public;

-- Zufälliges Salz für den IP-Hash, einmal erzeugt, nie öffentlich.
create table if not exists public.geheimnis (
  id   boolean primary key default true check (id),
  salz text    not null default (gen_random_uuid()::text || gen_random_uuid()::text)
);
insert into public.geheimnis (id) values (true) on conflict (id) do nothing;
alter table public.geheimnis enable row level security;
revoke all on table public.geheimnis from anon, authenticated, public;

-- IP-Adresse der Anfrage aus den Kopfzeilen, die die Data API an Postgres weiterreicht.
-- cf-connecting-ip setzt der vorgeschaltete Proxy selbst; x-forwarded-for nur als Ersatz.
-- Ohne Kopfzeilen (SQL Editor) null: dann gelten nur die Grenzen je Gerät und insgesamt.
create or replace function public.anfrage_ip()
returns text language plpgsql stable set search_path = public, pg_temp as $$
declare h json;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    return null;
  end;
  return nullif(btrim(coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', split_part(h->>'x-forwarded-for', ',', 1))), '');
end;
$$;
revoke all on function public.anfrage_ip() from public, anon, authenticated;

-- Zählt einen Aufruf der Art p_art (zaehlungen, beitraege, meldungen, stimmen) und bricht ab, sobald eine
-- Grenze überschritten ist. insert … on conflict sperrt die Zählerzeile: Parallele Anfragen warten
-- aufeinander und können dasselbe Kontingent nicht doppelt nutzen. Bricht der Aufruf ab, wird auch
-- das Hochzählen zurückgenommen.
create or replace function public.aufruf_zaehlen(p_art text, p_geraet_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_stunde timestamptz := date_trunc('hour', now());
  v_ip     text := public.anfrage_ip();
  v_n      integer;
  v_text   text := 'Gerade kommen zu viele Einreichungen, bitte später noch einmal';
begin
  insert into public.aufrufe as a (schluessel, stunde, anzahl) values ('geraet:' || p_art || ':' || p_geraet_id, v_stunde, 1)
  on conflict (schluessel, stunde) do update set anzahl = a.anzahl + 1 returning a.anzahl into v_n;
  if v_n > public.grenze(p_art || '_je_stunde', 30) then
    raise exception '%', v_text using errcode = 'P0001';
  end if;
  if v_ip is not null then
    insert into public.aufrufe as a (schluessel, stunde, anzahl)
    values ('ip:' || p_art || ':' || md5((select salz from public.geheimnis) || v_ip), v_stunde, 1)
    on conflict (schluessel, stunde) do update set anzahl = a.anzahl + 1 returning a.anzahl into v_n;
    if v_n > public.grenze(p_art || '_je_ip_stunde', 150) then
      raise exception '%', v_text using errcode = 'P0001';
    end if;
  end if;
  insert into public.aufrufe as a (schluessel, stunde, anzahl) values ('alle:' || p_art, v_stunde, 1)
  on conflict (schluessel, stunde) do update set anzahl = a.anzahl + 1 returning a.anzahl into v_n;
  if v_n > public.grenze(p_art || '_gesamt_stunde', 2000) then
    raise exception '%', v_text using errcode = 'P0001';
  end if;
  if random() < 0.02 then
    delete from public.aufrufe where stunde < now() - interval '3 hours';
  end if;
end;
$$;
revoke all on function public.aufruf_zaehlen(text, uuid) from public, anon, authenticated;

-- ===========================================================================
-- Fanzählungen
-- ===========================================================================
create table if not exists public.fan_zaehlungen (
  id           bigint generated always as identity primary key,
  lied_id      text        not null check (lied_id ~ '^[a-z0-9-]{1,120}$'),
  -- Laut aus der Datendatei; leer, wenn ein neuer Laut vorgeschlagen wird; 'keine' = keine Schalalas im Lied.
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

-- Spitzname ausblenden, die Zählung bleibt (für unpassende Namen). Bei Wiederholung nur ergänzt.
alter table public.fan_zaehlungen add column if not exists name_ausgeblendet boolean not null default false;

create index if not exists fan_zaehlungen_geraet_zeit on public.fan_zaehlungen (geraet_id, aktualisiert);

-- RLS an: Über die Data API kommt niemand direkt an die Zeilen, außer über die Moderations-Policies unten.
alter table public.fan_zaehlungen enable row level security;

-- Tabellenrechte für die öffentlichen Rollen ausdrücklich entziehen (Moderation bekommt unten gezielt Rechte zurück).
revoke all on table public.fan_zaehlungen from anon, authenticated, public;
revoke all on sequence public.fan_zaehlungen_id_seq from anon, authenticated, public;

-- Einreichen: nur über diese Funktion.
-- security definer: läuft mit den Rechten des Eigentümers (postgres) und darf deshalb schreiben,
-- obwohl anon selbst keine Tabellenrechte hat. Sie prüft alle Eingaben, ersetzt eine frühere
-- Einreichung desselben Geräts (gleiches Lied, gleicher Laut bzw. gleicher Vorschlag) und begrenzt
-- die Aufrufe je Gerät, je IP-Adresse und insgesamt (aufruf_zaehlen, grenzwerte zaehlungen_*).
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

  -- Ratenbegrenzung: jeder Aufruf zählt, auch das Ändern einer bestehenden Zählung.
  perform public.aufruf_zaehlen('zaehlungen', p_geraet_id);

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

-- Lesen: nur über diese Ansicht.
-- Die Ansicht läuft mit den Rechten ihres Eigentümers (security_invoker = false) und liest deshalb
-- die Tabelle, obwohl anon dort nichts darf. Sie enthält keine geraet_id, den Spitznamen nur, wenn er
-- nicht ausgeblendet ist, und lässt gesperrte Einträge aus. Neue Spalten nur hinten anfügen.
create or replace view public.fan_zaehlungen_oeffentlich
with (security_invoker = false) as
select lied_id, laut_id, anzahl, vorschlag, grundlage, aktualisiert,
       case when name_ausgeblendet then '' else spitzname end as spitzname
  from public.fan_zaehlungen
 where not gesperrt;

-- anon darf die Ansicht lesen, sonst nichts an ihr; authenticated bekommt nichts.
revoke all on table public.fan_zaehlungen_oeffentlich from anon, authenticated, public;
grant select on table public.fan_zaehlungen_oeffentlich to anon;

-- ===========================================================================
-- Schalalalogie: Tabellen
-- ===========================================================================
-- Themen: art 'lied' (eins je Lied, entsteht beim ersten Beitrag), 'frei' (Titel + erster Beitrag),
-- 'abstimmung' (Frage, 2 bis 6 Antworten, optionales Enddatum).
create table if not exists public.themen (
  id                bigint generated always as identity primary key,
  art               text        not null check (art in ('lied', 'frei', 'abstimmung')),
  lied_id           text        check (lied_id is null or lied_id ~ '^[a-z0-9-]{1,120}$'),
  titel             text        not null check (char_length(titel) between 1 and 140),
  spitzname         text        not null check (char_length(spitzname) between 1 and 40),
  geraet_id         uuid        not null,
  erstellt          timestamptz not null default now(),
  letzte_aktivitaet timestamptz not null default now(),
  endet             timestamptz,
  geschlossen       boolean     not null default false,
  gesperrt          boolean     not null default false,
  constraint lied_id_nur_bei_liedthema check ((art = 'lied') = (lied_id is not null))
);
create unique index if not exists themen_ein_liedthema on public.themen (lied_id) where art = 'lied';
create index if not exists themen_geraet_zeit on public.themen (geraet_id, erstellt);

create table if not exists public.beitraege (
  id        bigint generated always as identity primary key,
  thema_id  bigint      not null references public.themen (id) on delete cascade,
  text      text        not null check (char_length(text) between 1 and 2000),
  spitzname text        not null check (char_length(spitzname) between 1 and 40),
  geraet_id uuid        not null,
  erstellt  timestamptz not null default now(),
  gesperrt  boolean     not null default false
);
create index if not exists beitraege_thema on public.beitraege (thema_id, erstellt);
create index if not exists beitraege_geraet_zeit on public.beitraege (geraet_id, erstellt);

create table if not exists public.antworten (
  id       bigint generated always as identity primary key,
  thema_id bigint   not null references public.themen (id) on delete cascade,
  text     text     not null check (char_length(text) between 1 and 100),
  position smallint not null,
  unique (thema_id, position)
);

-- Eine Stimme je Gerät und Abstimmung (Primärschlüssel); eine neue Stimme ersetzt die alte.
create table if not exists public.stimmen (
  thema_id     bigint      not null references public.themen (id) on delete cascade,
  geraet_id    uuid        not null,
  antwort_id   bigint      not null references public.antworten (id) on delete cascade,
  erstellt     timestamptz not null default now(),
  aktualisiert timestamptz not null default now(),
  primary key (thema_id, geraet_id)
);
create index if not exists stimmen_antwort on public.stimmen (antwort_id);

-- Eine Meldung je Gerät und Beitrag. erledigt setzt die Moderation, wenn sie den Beitrag geprüft hat.
create table if not exists public.meldungen (
  id         bigint generated always as identity primary key,
  beitrag_id bigint      not null references public.beitraege (id) on delete cascade,
  grund      text        not null default '' check (char_length(grund) <= 300),
  geraet_id  uuid        not null,
  erstellt   timestamptz not null default now(),
  erledigt   boolean     not null default false,
  unique (beitrag_id, geraet_id)
);
create index if not exists meldungen_geraet_zeit on public.meldungen (geraet_id, erstellt);

-- Wer moderieren darf: Nutzer-IDs aus Supabase Auth. Pflege von Hand (siehe Kopf der Datei).
create table if not exists public.moderation (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  name     text not null default '',
  erstellt timestamptz not null default now()
);

-- RLS an allen Tabellen; ohne passende Policy sieht und ändert niemand etwas.
alter table public.themen     enable row level security;
alter table public.beitraege  enable row level security;
alter table public.antworten  enable row level security;
alter table public.stimmen    enable row level security;
alter table public.meldungen  enable row level security;
alter table public.moderation enable row level security;

-- Alle Tabellenrechte für die öffentlichen Rollen entziehen; Moderation bekommt unten gezielt Rechte zurück.
revoke all on table public.themen, public.beitraege, public.antworten, public.stimmen, public.meldungen, public.moderation
  from anon, authenticated, public;
revoke all on sequence public.themen_id_seq, public.beitraege_id_seq, public.antworten_id_seq, public.meldungen_id_seq
  from anon, authenticated, public;

-- ===========================================================================
-- Schalalalogie: Schreiben nur über Funktionen (security definer wie oben)
-- ===========================================================================
-- Gemeinsame Prüfungen. Nur intern, nicht von außen aufrufbar.
create or replace function public.pruefe_absender(p_spitzname text, p_geraet_id uuid)
returns text language plpgsql immutable set search_path = public, pg_temp as $$
declare v_name text := coalesce(btrim(p_spitzname), '');
begin
  if p_geraet_id is null then
    raise exception 'Geräte-Kennung fehlt' using errcode = '22023';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'Spitzname muss 1 bis 40 Zeichen haben' using errcode = '22023';
  end if;
  return v_name;
end;
$$;
revoke all on function public.pruefe_absender(text, uuid) from public, anon, authenticated;

create or replace function public.pruefe_beitragsgrenze(p_geraet_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.beitraege where geraet_id = p_geraet_id and erstellt > now() - interval '1 hour')
     >= public.grenze('beitraege_je_stunde', 30) then
    raise exception 'Zu viele Beiträge in kurzer Zeit, bitte später weiterschreiben' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function public.pruefe_beitragsgrenze(uuid) from public, anon, authenticated;

create or replace function public.pruefe_themengrenze(p_geraet_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.themen where geraet_id = p_geraet_id and erstellt > now() - interval '1 hour')
     >= public.grenze('themen_je_stunde', 10) then
    raise exception 'Zu viele neue Themen in kurzer Zeit, bitte später noch einmal' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function public.pruefe_themengrenze(uuid) from public, anon, authenticated;

-- Beitragstext: 1 bis 2000 Zeichen, nach Entfernen von Leerraum am Rand.
create or replace function public.pruefe_text(p_text text)
returns text language plpgsql immutable set search_path = public, pg_temp as $$
declare v text := btrim(coalesce(p_text, ''), E' \t\r\n');
begin
  if char_length(v) < 1 then
    raise exception 'Bitte einen Text schreiben' using errcode = '22023';
  end if;
  if char_length(v) > 2000 then
    raise exception 'Text zu lang (höchstens 2.000 Zeichen)' using errcode = '22023';
  end if;
  return v;
end;
$$;
revoke all on function public.pruefe_text(text) from public, anon, authenticated;

-- Thema anlegen.
--   lied:       p_lied_id und p_text (erster Beitrag). Gibt es das Liedthema schon, wird nur der Beitrag angehängt.
--   frei:       p_titel und p_text.
--   abstimmung: p_titel (Frage), p_antworten (2 bis 6), optional p_endet (in der Zukunft) und p_text.
-- Rückgabe: {"thema_id": …, "beitrag_id": … oder null}
create or replace function public.thema_anlegen(
  p_art       text,
  p_titel     text,
  p_text      text,
  p_lied_id   text,
  p_antworten text[],
  p_endet     timestamptz,
  p_spitzname text,
  p_geraet_id uuid
) returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name    text := public.pruefe_absender(p_spitzname, p_geraet_id);
  v_titel   text := btrim(coalesce(p_titel, ''));
  v_thema   public.themen%rowtype;
  v_beitrag bigint;
  v_antw    text[];
  v_a       text;
  i         integer := 0;
begin
  perform public.aufruf_zaehlen('beitraege', p_geraet_id);
  if p_art = 'lied' then
    if p_lied_id is null or p_lied_id !~ '^[a-z0-9-]{1,120}$' then
      raise exception 'Unbekanntes Lied' using errcode = '22023';
    end if;
    select * into v_thema from public.themen where art = 'lied' and lied_id = p_lied_id;
    if found then
      if v_thema.gesperrt then
        raise exception 'Dieses Thema ist gesperrt' using errcode = 'P0001';
      end if;
    else
      perform public.pruefe_themengrenze(p_geraet_id);
      if char_length(v_titel) < 1 or char_length(v_titel) > 140 then v_titel := p_lied_id; end if;
      insert into public.themen (art, lied_id, titel, spitzname, geraet_id)
      values ('lied', p_lied_id, v_titel, v_name, p_geraet_id)
      on conflict (lied_id) where art = 'lied' do nothing
      returning * into v_thema;
      if v_thema.id is null then
        select * into v_thema from public.themen where art = 'lied' and lied_id = p_lied_id;
      end if;
    end if;
  elsif p_art = 'frei' then
    if char_length(v_titel) < 1 or char_length(v_titel) > 140 then
      raise exception 'Titel muss 1 bis 140 Zeichen haben' using errcode = '22023';
    end if;
    perform public.pruefe_text(p_text);
    perform public.pruefe_themengrenze(p_geraet_id);
    insert into public.themen (art, titel, spitzname, geraet_id)
    values ('frei', v_titel, v_name, p_geraet_id) returning * into v_thema;
  elsif p_art = 'abstimmung' then
    if char_length(v_titel) < 1 or char_length(v_titel) > 140 then
      raise exception 'Frage muss 1 bis 140 Zeichen haben' using errcode = '22023';
    end if;
    select array_agg(x) into v_antw
      from (select btrim(a) as x from unnest(coalesce(p_antworten, '{}'::text[])) a) s
     where x <> '';
    if coalesce(array_length(v_antw, 1), 0) not between 2 and 6 then
      raise exception 'Eine Abstimmung braucht 2 bis 6 Antworten' using errcode = '22023';
    end if;
    if (select count(distinct lower(x)) from unnest(v_antw) x) <> array_length(v_antw, 1) then
      raise exception 'Jede Antwort nur einmal, bitte' using errcode = '22023';
    end if;
    if exists (select 1 from unnest(v_antw) x where char_length(x) > 100) then
      raise exception 'Antworten höchstens 100 Zeichen' using errcode = '22023';
    end if;
    if p_endet is not null and p_endet <= now() then
      raise exception 'Das Enddatum muss in der Zukunft liegen' using errcode = '22023';
    end if;
    if btrim(coalesce(p_text, '')) <> '' then perform public.pruefe_text(p_text); end if;
    perform public.pruefe_themengrenze(p_geraet_id);
    insert into public.themen (art, titel, spitzname, geraet_id, endet)
    values ('abstimmung', v_titel, v_name, p_geraet_id, p_endet) returning * into v_thema;
    foreach v_a in array v_antw loop
      i := i + 1;
      insert into public.antworten (thema_id, text, position) values (v_thema.id, v_a, i);
    end loop;
  else
    raise exception 'Unbekannte Art von Thema' using errcode = '22023';
  end if;

  -- Erster bzw. weiterer Beitrag (bei Abstimmungen optional).
  if p_art <> 'abstimmung' or btrim(coalesce(p_text, '')) <> '' then
    perform public.pruefe_beitragsgrenze(p_geraet_id);
    insert into public.beitraege (thema_id, text, spitzname, geraet_id)
    values (v_thema.id, public.pruefe_text(p_text), v_name, p_geraet_id) returning id into v_beitrag;
    update public.themen set letzte_aktivitaet = now() where id = v_thema.id;
  end if;

  return json_build_object('thema_id', v_thema.id, 'beitrag_id', v_beitrag);
end;
$$;
revoke all on function public.thema_anlegen(text, text, text, text, text[], timestamptz, text, uuid) from public, authenticated;
grant execute on function public.thema_anlegen(text, text, text, text, text[], timestamptz, text, uuid) to anon;

-- Beitrag in einem bestehenden Thema. Rückgabe: {"beitrag_id": …}
create or replace function public.beitrag_schreiben(
  p_thema_id  bigint,
  p_text      text,
  p_spitzname text,
  p_geraet_id uuid
) returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name    text := public.pruefe_absender(p_spitzname, p_geraet_id);
  v_text    text := public.pruefe_text(p_text);
  v_beitrag bigint;
begin
  perform public.aufruf_zaehlen('beitraege', p_geraet_id);
  if not exists (select 1 from public.themen where id = p_thema_id and not gesperrt) then
    raise exception 'Dieses Thema gibt es nicht oder es ist gesperrt' using errcode = 'P0001';
  end if;
  perform public.pruefe_beitragsgrenze(p_geraet_id);
  insert into public.beitraege (thema_id, text, spitzname, geraet_id)
  values (p_thema_id, v_text, v_name, p_geraet_id) returning id into v_beitrag;
  update public.themen set letzte_aktivitaet = now() where id = p_thema_id;
  return json_build_object('beitrag_id', v_beitrag);
end;
$$;
revoke all on function public.beitrag_schreiben(bigint, text, text, uuid) from public, authenticated;
grant execute on function public.beitrag_schreiben(bigint, text, text, uuid) to anon;

-- Abstimmen: eine Stimme je Gerät und Abstimmung, änderbar, solange die Abstimmung offen ist.
create or replace function public.abstimmen(
  p_thema_id   bigint,
  p_antwort_id bigint,
  p_geraet_id  uuid
) returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_thema public.themen%rowtype;
begin
  if p_geraet_id is null then
    raise exception 'Geräte-Kennung fehlt' using errcode = '22023';
  end if;
  perform public.aufruf_zaehlen('stimmen', p_geraet_id);
  select * into v_thema from public.themen where id = p_thema_id;
  if not found or v_thema.gesperrt or v_thema.art <> 'abstimmung' then
    raise exception 'Diese Abstimmung gibt es nicht' using errcode = 'P0001';
  end if;
  if v_thema.geschlossen or (v_thema.endet is not null and v_thema.endet <= now()) then
    raise exception 'Diese Abstimmung ist geschlossen' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.antworten where id = p_antwort_id and thema_id = p_thema_id) then
    raise exception 'Diese Antwort gehört nicht zur Abstimmung' using errcode = '22023';
  end if;
  insert into public.stimmen (thema_id, geraet_id, antwort_id)
  values (p_thema_id, p_geraet_id, p_antwort_id)
  on conflict (thema_id, geraet_id) do update
    set antwort_id = excluded.antwort_id, aktualisiert = now();
  return json_build_object('ok', true);
end;
$$;
revoke all on function public.abstimmen(bigint, bigint, uuid) from public, authenticated;
grant execute on function public.abstimmen(bigint, bigint, uuid) to anon;

-- Melden: eine Meldung je Gerät und Beitrag; eine zweite Meldung desselben Geräts ändert nichts.
-- Der Beitrag bleibt sichtbar, bis die Moderation ihn sperrt.
create or replace function public.melden(
  p_beitrag_id bigint,
  p_grund      text,
  p_geraet_id  uuid
) returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_neu integer;
begin
  if p_geraet_id is null then
    raise exception 'Geräte-Kennung fehlt' using errcode = '22023';
  end if;
  if not exists (select 1 from public.beitraege where id = p_beitrag_id and not gesperrt) then
    raise exception 'Diesen Beitrag gibt es nicht' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_grund, '')) > 300 then
    raise exception 'Grund zu lang (höchstens 300 Zeichen)' using errcode = '22023';
  end if;
  perform public.aufruf_zaehlen('meldungen', p_geraet_id);
  insert into public.meldungen (beitrag_id, grund, geraet_id)
  values (p_beitrag_id, btrim(coalesce(p_grund, '')), p_geraet_id)
  on conflict (beitrag_id, geraet_id) do nothing;
  get diagnostics v_neu = row_count;
  return json_build_object('ok', true, 'neu', v_neu > 0);
end;
$$;
revoke all on function public.melden(bigint, text, uuid) from public, authenticated;
grant execute on function public.melden(bigint, text, uuid) to anon;

-- ===========================================================================
-- Schalalalogie: Lesen nur über Ansichten (ohne geraet_id, ohne Gesperrtes)
-- ===========================================================================
-- geschlossen ist auch wahr, wenn das Enddatum vorbei ist. Neue Spalten nur hinten anfügen.
create or replace view public.themen_oeffentlich
with (security_invoker = false) as
select t.id, t.art, t.lied_id, t.titel, t.spitzname, t.erstellt, t.letzte_aktivitaet, t.endet,
       (t.geschlossen or (t.endet is not null and t.endet <= now())) as geschlossen,
       (select count(*) from public.beitraege b where b.thema_id = t.id and not b.gesperrt) as beitraege,
       (select count(*) from public.stimmen s where s.thema_id = t.id) as stimmen
  from public.themen t
 where not t.gesperrt;

create or replace view public.beitraege_oeffentlich
with (security_invoker = false) as
select b.id, b.thema_id, b.text, b.spitzname, b.erstellt
  from public.beitraege b
  join public.themen t on t.id = b.thema_id
 where not b.gesperrt and not t.gesperrt;

create or replace view public.antworten_oeffentlich
with (security_invoker = false) as
select a.id, a.thema_id, a.text, a.position,
       (select count(*) from public.stimmen s where s.antwort_id = a.id) as stimmen
  from public.antworten a
  join public.themen t on t.id = a.thema_id
 where not t.gesperrt;

revoke all on table public.themen_oeffentlich, public.beitraege_oeffentlich, public.antworten_oeffentlich
  from anon, authenticated, public;
grant select on table public.themen_oeffentlich, public.beitraege_oeffentlich, public.antworten_oeffentlich to anon;

-- ===========================================================================
-- Moderation (angemeldet über Supabase Auth, Nutzer-ID in public.moderation)
-- ===========================================================================
-- Prüft, ob die angemeldete Person moderieren darf. security definer, damit die Policies die Tabelle
-- moderation lesen können, ohne dass authenticated sie selbst lesen dürfte.
create or replace function public.ist_moderator()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.moderation where user_id = auth.uid());
$$;
revoke all on function public.ist_moderator() from public, anon;
grant execute on function public.ist_moderator() to authenticated;

-- Lesen: alle Einträge (auch gesperrte), Meldungen und Abstimmungsantworten.
-- Ändern: nur die Spalten zum Sperren/Freigeben, Schließen und Erledigen. Löschen und Anlegen gibt es nicht.
-- Die Rechte gelten nur, wenn die Policy (ist_moderator) zustimmt; andere Angemeldete sehen nichts.
grant select on table public.fan_zaehlungen, public.themen, public.beitraege, public.antworten, public.meldungen to authenticated;
grant update (gesperrt, name_ausgeblendet) on table public.fan_zaehlungen to authenticated;
grant update (gesperrt, geschlossen)       on table public.themen         to authenticated;
grant update (gesperrt)                    on table public.beitraege      to authenticated;
grant update (erledigt)                    on table public.meldungen      to authenticated;

drop policy if exists moderation_lesen on public.fan_zaehlungen;
drop policy if exists moderation_lesen on public.themen;
drop policy if exists moderation_lesen on public.beitraege;
drop policy if exists moderation_lesen on public.antworten;
drop policy if exists moderation_lesen on public.meldungen;
create policy moderation_lesen on public.fan_zaehlungen for select to authenticated using (public.ist_moderator());
create policy moderation_lesen on public.themen         for select to authenticated using (public.ist_moderator());
create policy moderation_lesen on public.beitraege      for select to authenticated using (public.ist_moderator());
create policy moderation_lesen on public.antworten      for select to authenticated using (public.ist_moderator());
create policy moderation_lesen on public.meldungen      for select to authenticated using (public.ist_moderator());

drop policy if exists moderation_aendern on public.fan_zaehlungen;
drop policy if exists moderation_aendern on public.themen;
drop policy if exists moderation_aendern on public.beitraege;
drop policy if exists moderation_aendern on public.meldungen;
create policy moderation_aendern on public.fan_zaehlungen for update to authenticated using (public.ist_moderator()) with check (public.ist_moderator());
create policy moderation_aendern on public.themen         for update to authenticated using (public.ist_moderator()) with check (public.ist_moderator());
create policy moderation_aendern on public.beitraege      for update to authenticated using (public.ist_moderator()) with check (public.ist_moderator());
create policy moderation_aendern on public.meldungen      for update to authenticated using (public.ist_moderator()) with check (public.ist_moderator());

-- Die eigene Zeile in moderation darf man lesen (so erkennt die Werkstatt, ob man moderieren darf).
grant select on table public.moderation to authenticated;
drop policy if exists eigene_zeile on public.moderation;
create policy eigene_zeile on public.moderation for select to authenticated using (user_id = auth.uid());

-- Die Data API soll die neuen Tabellen, Ansichten und Funktionen sofort kennen.
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Von Hand sperren (alternativ in der Werkstatt nach Anmeldung):
--   update public.fan_zaehlungen set gesperrt = true where id = 123;
--   update public.fan_zaehlungen set gesperrt = true where spitzname = 'Beispiel';
--   update public.fan_zaehlungen set name_ausgeblendet = true where spitzname = 'Beispiel';
--   update public.beitraege set gesperrt = true where id = 45;
--   update public.themen set gesperrt = true where id = 6;
--   update public.themen set geschlossen = true where id = 7;   -- Abstimmung schließen
-- ---------------------------------------------------------------------------
