# Daily Challenge – Spezifikation

Home-Assistant-Custom-Integration (HACS / HA Marketplace) zum Tracken von täglichen, mengenbasierten Challenges (z. B. «20 Liegestütze pro Tag»), inkl. eigener Lovelace-Card.

- **Name:** Daily Challenge
- **Domain:** `daily_challenge`
- **Repo:** `Skylolerr/ha-daily-challenge` (privat während Phase 1–2, öffentlich ab dem ersten Beta-Release v0.1.0)
- **Lizenz:** MIT, Copyright Skylolerr
- **Mindestversion:** Home Assistant 2026.10.0 (vom Maintainer am 2026-10-23 von 2026.11.0 gesenkt, damit v0.1.0 nicht auf 2026.11 warten muss)
- **Sprachen:** EN (Basis), DE, FR, IT
- **Code, Kommentare, README, Commit-Messages:** Englisch

---

## 1. Positionierung

Es gibt bereits Habit-Tracker für HA (`habit_tracker`, `habit_log`). Daily Challenge grenzt sich ab durch:

- **Mengenziel pro Tag** statt Ja/Nein-Habit
- **Soll/Ist über die ganze Laufzeit** (Vorsprung/Rückstand, Rest bis Endziel)
- **Optionaler Catch-up-Modus** (der gestrige Rückstand erhöht das heutige Ziel)
- **Nachträgliches Korrigieren** jedes vergangenen Tages
- Saubere Entities, die auch ohne die eigene Card mit Tile/Mushroom/ApexCharts funktionieren

README-Abgrenzung zu «HA Daily Counter» (Geek-MD): «Not a sensor-triggered counter – a goal-based daily challenge tracker.»

---

## 2. Entscheidungen (fix)

| Thema | Entscheidung |
|---|---|
| Struktur | **Ein Config Entry pro Challenge**, ein Device pro Challenge |
| Integrationstyp | `integration_type: service` (keine Helper-Integration) |
| Datenhaltung | `helpers.storage.Store` pro Challenge = Source of Truth |
| Card | Im selben Repo, von der Integration ausgeliefert und automatisch registriert |
| Statistik | MVP: Card + WebSocket/Action aus Rohdaten. Rückwirkende Long-Term-Statistics erst später |
| Streak-Regel | Pro Challenge einstellbar, **Default: Tagesziel erreicht** (Alternative: Wert > 0) |
| Rückstand | Pro Challenge einstellbar, **Default: nur anzeigen** (Alternative: Catch-up) |
| Ruhetage / Skip-Tage | **Nicht vorgesehen** («daily» heisst täglich) |
| Datenimport | Nicht im MVP (kein Migrationsbedarf) |

---

## 3. Repo-Struktur

```
ha-daily-challenge/
├── custom_components/daily_challenge/
│   ├── __init__.py            # Setup, Store laden, Rollover, Frontend-Registrierung
│   ├── manifest.json
│   ├── const.py
│   ├── config_flow.py         # Config Flow + Options Flow
│   ├── coordinator.py         # ChallengeData: Store, Berechnungen, Listener
│   ├── calculations.py        # Reine Funktionen (Streak, Soll/Ist, Catch-up) – gut testbar
│   ├── entity.py              # Basis-Entity (DeviceInfo, has_entity_name)
│   ├── number.py
│   ├── button.py
│   ├── sensor.py
│   ├── binary_sensor.py
│   ├── services.py            # Actions add/set/get_history
│   ├── services.yaml
│   ├── websocket.py           # daily_challenge/history, daily_challenge/list
│   ├── frontend.py            # Static Path + Lovelace-Resource
│   ├── diagnostics.py
│   ├── icons.json
│   ├── strings.json
│   ├── translations/{en,de,fr,it}.json
│   ├── brand/icon.png, icon@2x.png, dark_icon.png, dark_icon@2x.png
│   └── frontend/daily-challenge-card.js   # Gebautes Bundle (wird committet)
├── card/                      # Quellcode der Card (TypeScript, Lit)
│   ├── src/…
│   ├── package.json
│   └── rollup.config.mjs
├── tests/
├── scripts/deploy.sh          # Dev-Deploy auf eigene HA-Instanz
├── .github/workflows/{validate.yml, tests.yml, release.yml}
├── hacs.json
├── README.md
└── LICENSE
```

Das Card-Bundle wird **committet**, weil HACS/Marketplace keinen Build-Schritt ausführt. CI prüft, dass das Bundle zum Quellcode passt.

### manifest.json

```json
{
  "domain": "daily_challenge",
  "name": "Daily Challenge",
  "codeowners": ["@Skylolerr"],
  "config_flow": true,
  "dependencies": ["http", "frontend"],
  "after_dependencies": ["lovelace"],
  "documentation": "https://github.com/Skylolerr/ha-daily-challenge",
  "integration_type": "service",
  "iot_class": "calculated",
  "issue_tracker": "https://github.com/Skylolerr/ha-daily-challenge/issues",
  "requirements": [],
  "version": "0.1.0"
}
```

### hacs.json

```json
{
  "name": "Daily Challenge",
  "homeassistant": "2026.10.0",
  "render_readme": true
}
```

---

## 4. Konfiguration

### Config Flow (Challenge anlegen)

| Feld | Typ | Default | Validierung |
|---|---|---|---|
| `name` | Text | – | Pflicht, eindeutig unter den Challenges |
| `icon` | Icon-Selector | `mdi:trophy` | – |
| `unit` | Text (mit Vorschlägen: Wiederholungen, Minuten, km, Seiten, Gläser) | Wiederholungen | Pflicht |
| `daily_target` | Zahl | 20 | > 0, ganzzahlig |
| `start_date` | Datum | heute | nicht in der Zukunft |
| `end_date` | Datum, optional | leer | > `start_date` |
| `steps` | Liste von bis zu 3 Zahlen | `[1, 5, 10]` | > 0, aufsteigend, eindeutig |
| `streak_rule` | Auswahl `target` / `any` | `target` | – |
| `deficit_mode` | Auswahl `display` / `catch_up` | `display` | – |

Der Titel des Config Entry ist `name`. Die `unique_id` ist eine generierte UUID.

### Options Flow

Alle Felder sind änderbar. Spezialfälle:

- **`daily_target` geändert:** Die Änderung gilt **ab heute**. Sie wird in `target_history` gespeichert (siehe Datenmodell), damit das Soll vergangener Tage unverändert bleibt.
- **`steps` geändert:** Die Buttons werden neu erzeugt. Verwaiste Button-Entities werden aus der Entity Registry entfernt.
- **`start_date` nach hinten verschoben:** Tage vor dem neuen Start werden ignoriert, aber nicht gelöscht.

---

## 5. Datenmodell

Pro Challenge eine Store-Datei `.storage/daily_challenge.<entry_id>`, `STORAGE_VERSION = 1`:

```json
{
  "days": { "2026-11-01": 20, "2026-11-02": 25 },
  "target_history": { "2026-11-01": 20, "2026-12-01": 25 }
}
```

- `days`: nur Tage mit Wert > 0. Wird ein Tag auf 0 gesetzt, wird sein Key entfernt.
- `target_history`: Gültigkeitsbeginn → Tagesziel. Das Ziel eines Tages ist der letzte Eintrag mit Datum ≤ Tag. Der erste Eintrag ist das `start_date`.
- Gespeichert wird mit `async_delay_save` (ca. 2 s), damit schnelle Klicks gebündelt werden. Beim Unload wird sofort gespeichert.
- `async_remove_entry` löscht die Store-Datei.

---

## 6. Berechnungslogik

Alles in `calculations.py` als reine Funktionen mit Input (`days`, `target_history`, Optionen, `today`). Das macht sie isoliert testbar.

**Begriffe:**
- `today`: aktuelles lokales Datum in der HA-Zeitzone (`dt_util.now().date()`).
- `value(d)`: Wert des Tages d (0 falls kein Eintrag).
- `target(d)`: Tagesziel gemäss `target_history`.
- Laufzeit: `start_date` bis `min(today, end_date)`.

**Kennzahlen:**
- `total`: Summe aller `value(d)` in der Laufzeit
- `target_to_date`: Summe aller `target(d)` von `start_date` bis heute, inklusive heute
- `delta`: `total − target_to_date`. Positiv heisst Vorsprung, negativ Rückstand.
- `deficit_yesterday`: `max(0, target(gestern) − value(gestern))`, nur der gestrige Rückstand (0, wenn gestern vor dem `start_date` liegt). Ältere Rückstände werden nicht weitergetragen, ein Vorsprung senkt nichts.
- `effective_target_today`:
  - Modus `display`: `target(today)`
  - Modus `catch_up`: `target(today) + deficit_yesterday`
- `progress_today`: `value(today) / effective_target_today × 100`, auf 0–999 begrenzt
- `goal_reached_today`: `value(today) ≥ effective_target_today`
- Nur mit `end_date`: `end_target = Σ target(d)` über die ganze Laufzeit bis `end_date`. Daraus `remaining = max(0, end_target − total)`.
- Nur mit `end_date`: `days_left` = Tage von heute (bzw. vom `start_date`, falls die Challenge noch nicht begonnen hat) bis `end_date`, heute eingeschlossen; nach dem Ende 0. `required_per_day = remaining / days_left`, 1 Dezimalstelle, nach dem Ende leer. Der heutige Wert zählt sofort mit, passend zu «Noch … in … Tagen».
- `average_per_day`: `total / Anzahl vergangener Tage inkl. heute`
- `best_day`: maximaler Tageswert, das Datum kommt als Attribut dazu
- `this_week` / `this_month` / `this_year`: Summen. Die Woche beginnt am Montag (ISO).

**Tag erfüllt (für Streak):**
- `streak_rule = any`: `value(d) > 0`
- `streak_rule = target`, Modus `display`: `value(d) ≥ target(d)`
- `streak_rule = target`, Modus `catch_up`: Der Tag gilt als erfüllt, wenn `value(d) ≥ target(d)` oder wenn er **am direkten Folgetag** aufgeholt wird: `value(d) + value(d+1) ≥ target(d) + target(d+1)`. Weiter zurück lässt sich nichts aufholen, und Vorarbeiten zählt nicht für spätere Tage. Ein nie aufgeholter Tag bricht den Streak einmal, blockiert ihn aber nicht dauerhaft. Für `gestern` ist der Status vorläufig, bis `heute` vorbei ist: Während heute gilt gestern als «noch rettbar» und bricht den Streak nicht (zählt aber auch nicht). Der laufende `heute` zählt erst, wenn das effektive Tagesziel inkl. Rückstand von gestern erreicht ist (dann ist gestern zugleich aufgeholt); nur das eigene Tagesziel reicht während des Tages nicht. Ist heute vorbei, gilt für ihn wieder die normale Regel. (Entschieden 2026-10-23.) Ohne Catch-up gibt es kein Aufholen; ein verpasster Tag beendet den Streak. (Entschieden 2026-10-23.)

**Streak:**
- `current_streak`: Anzahl aufeinanderfolgender erfüllter Tage bis gestern. Ist heute bereits erfüllt, zählt heute dazu. **Ein noch nicht erfüllter heutiger Tag bricht den Streak nicht.**
- `best_streak`: längste Serie in der gesamten Historie, inklusive Start- und Enddatum als Attribute.

Nach jeder Datenänderung, beim Tageswechsel und beim Start werden alle Kennzahlen neu berechnet. Das ist günstig genug: maximal ein paar tausend Tage.

---

## 7. Tageswechsel

- Ein Timer auf den Beginn des nächsten lokalen Tags (`async_track_point_in_utc_time` auf `start_of_local_day(morgen)`, danach neu geplant) löst eine Neuberechnung aus und benachrichtigt die Entities. Kein Zeitmuster «00:00:00»: In Zeitzonen, in denen die Sommerzeit um Mitternacht beginnt (z. B. Chile), gibt es 00:00 an diesem Tag nicht, und ein Muster würde den ganzen Tag überspringen.
- Beim Setup wird alles mit dem aktuellen Datum neu berechnet. So stimmt alles auch dann, wenn HA über Mitternacht aus war.
- Es wird nie etwas «zurückgesetzt». Es wird nur ein neuer Datumsschlüssel gelesen. Darum sind Sommerzeit und Neustarts unkritisch.
- Nach `end_date` nimmt die Challenge keine Werte mehr für neue Tage an (Status «beendet»). Vergangene Tage bleiben editierbar.

---

## 8. Entities

Ein Device pro Challenge, mit Name = Challenge-Name und `entry_type: service`. Alle Entities verwenden `has_entity_name = True` und `translation_key`. Die `unique_id` ist `<entry_id>_<key>`.

| Plattform | Key | Beschreibung | Details |
|---|---|---|---|
| number | `today` | Wert heute, direkt setzbar | min 0, max 100000, step 1, mode box |
| button | `add_<n>` | +n für jeden Wert in `steps` | Name z. B. «+5» |
| button | `subtract` | −kleinster Step | nie unter 0 |
| sensor | `today_target` | effektives Ziel heute | – |
| sensor | `progress` | Fortschritt heute | `%`, measurement |
| sensor | `total` | Gesamt seit Start | `state_class: total` (**nicht** `total_increasing`, weil «−» sonst als Reset gilt) |
| sensor | `current_streak` | aktueller Streak | Einheit `d`, measurement |
| sensor | `best_streak` | bester Streak | Einheit `d`, Attribute: start/end |
| sensor | `target_to_date` | Soll bis heute | – |
| sensor | `delta` | Vorsprung (+) / Rückstand (−) | measurement |
| sensor | `remaining` | Rest bis Endziel | nur wenn `end_date` gesetzt |
| sensor | `days_left` | verbleibende Tage inkl. heute | Einheit `d`, nur wenn `end_date` gesetzt |
| sensor | `required_per_day` | nötiger Schnitt pro Tag bis zum Endziel | Einheit `<unit>/d`, measurement, 1 Dezimalstelle, nur wenn `end_date` gesetzt |
| sensor | `average` | Ø pro Tag | 1 Dezimalstelle |
| sensor | `best_day` | bester Tageswert | Attribut `date` |
| sensor | `this_week` / `this_month` / `this_year` | Summen | – |
| binary_sensor | `goal_reached_today` | Tagesziel erreicht | Basis für Erinnerungen |

- Die Einheit der Mengen-Sensoren ist die konfigurierte `unit`.
- `entity_category: diagnostic` für `target_to_date`, `average`, `this_week`, `this_month`, `this_year`. Diese Entities sind standardmässig aktiv, landen aber nicht in den automatischen Haupt-Dashboards.
- Icons kommen über `icons.json`, mit Zustandsicons für `goal_reached_today`.

---

## 9. Actions (Services)

Registriert in `async_setup`. Das Feld `config_entry_id` (Config-Entry-Selector auf `daily_challenge`) wählt die Challenge.

| Action | Felder | Verhalten |
|---|---|---|
| `daily_challenge.add` | `config_entry_id`, `amount` (int, darf negativ sein), `date` (optional, Default heute) | addiert, Ergebnis nie < 0 |
| `daily_challenge.set` | `config_entry_id`, `value` (int ≥ 0), `date` (optional) | setzt den Tageswert, 0 entfernt den Eintrag |
| `daily_challenge.get_history` | `config_entry_id`, `start` (optional), `end` (optional) | `supports_response: only`, liefert `{days: {...}, targets: {...}, fulfilled: {...}}` |

Validierung mit **übersetzten Exceptions** (`ServiceValidationError` mit `translation_key`):
- Datum in der Zukunft
- Datum vor `start_date` oder nach `end_date`
- Unbekannte oder nicht geladene Challenge

---

## 10. WebSocket-API (für die Card)

- `daily_challenge/list` liefert alle Challenges mit `entry_id`, `name`, `icon`, `unit` und den zugehörigen Entity-IDs. Der Card-Editor nutzt das.
- `daily_challenge/history` (`entry_id`, `start`, `end`) liefert dieselbe Struktur wie `get_history`.
- `daily_challenge/set_day` (`entry_id`, `date`, `value`) dient zum Editieren vergangener Tage aus der Card. Es gilt dieselbe Validierung wie bei der Action.

Die Card holt die Historie neu, sobald sich der State von `sensor.<challenge>_total` ändert.

---

## 11. Frontend-Auslieferung

- Static Path `/daily_challenge/daily-challenge-card.js` via `hass.http.async_register_static_paths([StaticPathConfig(...)])`, mit Cache.
- **Lovelace im Storage-Modus:** Die Ressource wird als Modul mit `?v=<manifest-version>-<hash>` registriert; `<hash>` sind die ersten 8 Zeichen des SHA-256 des Bundles. So bekommt jedes geänderte Bundle eine neue URL, auch zwischen zwei Releases (der Browser cacht das Bundle sonst bis zu 31 Tage). Eine bestehende Ressource mit anderer URL wird aktualisiert, sodass nie Duplikate entstehen.
- **YAML-Modus:** Fallback mit `frontend.add_extra_js_url`.
- Die Registrierung passiert genau einmal pro HA-Start, nicht pro Config Entry.
- Wird der letzte Config Entry entfernt, wird auch die Lovelace-Ressource entfernt.

---

## 12. Card `custom:daily-challenge-card`

TypeScript + Lit, gebündelt mit Rollup zu einer einzigen JS-Datei, ohne externe Runtime-Abhängigkeiten.

### Konfiguration

```yaml
type: custom:daily-challenge-card
entity: number.liegestutze_today   # beliebige Entity der Challenge; die Card findet die übrigen
show_streak: true                  # Streak in der Kopfzeile
show_target_vs_actual: true        # Zeile «Ist / Soll · Vorsprung»
show_remaining: true               # «Noch … in … Tagen» (nur mit Enddatum)
show_required_average: true        # «Ø …/Tag» nötiger Schnitt (nur mit Enddatum)
show_catch_up: true                # «Heute: 20 + 10 Rückstand» (nur im Catch-up-Modus)
show_buttons: true                 # Buttons − und +n
show_heatmap: true                 # ab Phase 4 (v0.2.0)
heatmap_range: year                # year | 6months | 3months
```

- Alle `show_*`-Optionen sind standardmässig `true` und im visuellen Editor als Schalter einstellbar. Der Editor schreibt nur abweichende Werte (`false`) ins YAML. Tageswert und Fortschrittsring sind immer sichtbar.

- `getStubConfig()` wählt die erste vorhandene Challenge.
- `getConfigElement()` liefert einen visuellen Editor mit Challenge-Dropdown (`daily_challenge/list`) und Optionen.
- Die Card trägt sich in `window.customCards` ein, damit sie im Card-Picker erscheint.
- Die Card übernimmt die Theme-Variablen von HA und funktioniert im Light- und Dark-Mode.

### Inhalt (Phase 2, MVP)

- Kopfzeile mit Icon, Name und Streak (🔥 aktuell / Best)
- Grosser Tageswert mit Fortschrittsring gegen `effective_target_today`. Bei erreichtem Ziel wird der Ring in Erfolgsfarbe ganz gefüllt.
- Buttons: «−» und je ein «+n» pro Step. Ein langer Druck auf den Wert öffnet ein Eingabefeld für einen direkten Wert.
- Soll/Ist-Zeile: «Ist 1'240 / Soll 1'200 · +40». Mit Enddatum zusätzlich «Noch 3'100 in 60 Tagen · Ø 51,7/Tag».
- Im Catch-up-Modus ist der Rückstand im heutigen Ziel sichtbar markiert, z. B. «20 + 10 Rückstand».

### Phase 4 (v0.2.0, nach dem ersten Release)

- **Heatmap** im GitHub-Stil, Wochen als Spalten, Montag oben. Die Farbintensität entspricht `value/target`. Erfüllte und unerfüllte Tage sind klar unterscheidbar. Tage ausserhalb der Laufzeit werden ausgegraut.
- **Tag antippen** öffnet einen Dialog mit Datum, Wert und Ziel. Der Wert ist änderbar via `daily_challenge/set_day`.
- Kompakte Statistik-Zeile: Total, Ø/Tag, bester Tag, bester Streak.

### Übersetzungen der Card

Eigene i18n-Dateien für EN, DE, FR und IT. Die Sprache folgt `hass.locale.language`, Fallback ist EN. Zahlen werden mit `hass.locale` formatiert (z. B. Tausendertrennzeichen 1'240 in de-CH).

---

## 13. Qualität

- `ConfigEntry.runtime_data` mit typisierter Entry-Klasse, kein `hass.data`
- Vollständig async, keine blockierenden Aufrufe im Event Loop
- `diagnostics.py` mit Optionen, Anzahl erfasster Tage, erstem und letztem Datum, aktuellen Kennzahlen
- `strings.json` plus `translations/{en,de,fr,it}.json` für Config/Options Flow, Entity-Namen, Exceptions und Actions
- `quality_scale.yaml` als interne Checkliste. Ziel: Silver-Regeln vollständig, Gold-Regeln soweit sinnvoll.
- Typisierung mit mypy (strict für eigene Module), Linting mit Ruff

### Tests (`pytest-homeassistant-custom-component`, `freezegun`)

- `calculations.py`: Streak-Regeln, Catch-up inkl. «am Folgetag repariert», Zieländerung über `target_history`, Enddatum, leere Historie
- Tageswechsel um Mitternacht und bei Sommerzeit-Umstellung (Europe/Zurich, März und Oktober)
- HA-Neustart über Mitternacht
- Config Flow, Options Flow (Validierungsfehler, Step-Änderung entfernt verwaiste Buttons)
- Actions inklusive aller Fehlerfälle
- Store: Persistenz über Reload, Löschen bei Entry-Entfernung
- Ziel: ≥ 90 % Coverage für die Python-Module

---

## 14. CI / Release

**`validate.yml`** (Push + PR):
- `hacs/action` mit `category: integration`, **ohne Ignores**
- `home-assistant/actions/hassfest`
- Ruff + mypy
- Card: `npm ci && npm run build`, danach `git diff --exit-code` auf das Bundle

**`tests.yml`:** pytest mit Coverage.

**`release.yml`** (bei veröffentlichtem GitHub-Release):
- prüft Tag == `manifest.json` → `version` (Format `vX.Y.Z` bzw. `X.Y.Z` einheitlich festlegen)
- hängt optional ein ZIP an

Releases sind immer **echte GitHub-Releases** mit Changelog, nicht nur Tags.

---

## 15. Dev-Deploy

HACS kann private Repos nicht installieren. Für Phase 1–2 und später für schnelles Testen ohne Release gibt es `scripts/deploy.sh`:

- baut die Card
- kopiert `custom_components/daily_challenge/` per `rsync` über SSH auf die HA-Instanz (Variablen `HA_HOST`, `HA_USER`, `HA_CONFIG_PATH` aus `.env`, die `.env` steht in `.gitignore`)
- startet HA optional per REST-API neu (`HA_TOKEN` aus `.env`)

Voraussetzung auf HA: das SSH-Add-on («Advanced SSH & Web Terminal» oder «Terminal & SSH»).

---

## 16. Phasen & Releases

Ziel: **früh öffentlich gehen**, sobald die Basisfunktionen stabil laufen. Danach wird iterativ mit Beta-Releases erweitert.

1. **Phase 1 – Integration-Kern (privat):** Config/Options Flow, Store, Berechnungen, alle Entities, Actions, Tageswechsel, Übersetzungen EN/DE, Diagnostics, Tests, CI. Testen auf der eigenen HA-Instanz via `deploy.sh` mit Standard-Karten (Tile, Entities).
2. **Phase 2 – Card MVP (privat):** Auslieferung und Registrierung der Card, Zähler, Buttons, Ring, Streak, Soll/Ist, visueller Editor.
3. **Phase 3 – Erster öffentlicher Release v0.1.0 (Beta):**
   - Übersetzungen FR/IT ergänzen (Integration und Card), im README als «community review welcome» markieren
   - Brand-Icons in `brand/`
   - README: Features, Screenshots, Installation via HACS Custom Repository bzw. Marketplace, My-HA-Badges, Konfiguration, Entities, Actions, Entfernen, Hinweis «Beta – breaking changes possible before 1.0»
   - CHANGELOG.md
   - Repo-Beschreibung, Topics (`home-assistant`, `hacs`, `integration`, `habit-tracker`, `challenge`), Issues aktiviert, Issue-Templates (Bug/Feature)
   - Repo öffentlich schalten, GitHub-Release v0.1.0 als **normaler Release** (kein Pre-Release, damit HACS ihn ohne Beta-Schalter anzeigt; der Beta-Hinweis steht im README)
   - Direkt danach PR an `hacs/default` vom Account `Skylolerr` (die Prüfung dort dauert laut HACS Monate)
   - Erinnerungs-Blueprint `blueprints/automation/daily_challenge/reminder.yaml` auf Basis von `goal_reached_today` (vorgezogen aus «Später», 2026-10-23), mit Import-Button im README
   - Installation über HACS «Custom Repository» auf der eigenen Instanz verifizieren
4. **Phase 4 – v0.2.0:** Heatmap, Dialog zum Bearbeiten vergangener Tage, Statistik-Zeile.
5. **Phase 5 – v1.0.0:** Stabilisierung auf Basis von Feedback/Issues, keine Breaking Changes mehr ab hier. (Der PR an `hacs/default` ist auf Phase 3 vorgezogen, Entscheid des Maintainers vom 2026-10-23.)

**Versionierung:** SemVer. Vor 1.0 dürfen Minor-Releases Breaking Changes enthalten. Diese werden im CHANGELOG klar markiert. Store-Format-Änderungen laufen immer über eine Store-Migration, Nutzerdaten gehen nie verloren.

### Unterschritte (optional)

Standardmässig wird eine Phase als Ganzes umgesetzt. Die Unterschritte sind nur Haltepunkte für den Fall, dass eine Session bewusst nur einen Teil einer Phase umsetzt (z. B. aus Zeitgründen, «mach nur 2.a–2.c»). Jeder Unterschritt endet in einem prüfbaren Zustand. **(M)** = Aufgabe des Maintainers.

**Phase 1 – Integration-Kern**
- 1.a Berechnungen mit Tests, Store, Tageswechsel
- 1.b Config/Options Flow, Entities, Actions, Übersetzungen EN/DE, Diagnostics, CI, `deploy.sh`
- 1.c **(M)** Test auf der eigenen HA-Instanz mit Standard-Karten, Feedback
- 1.d Bugfixes aus 1.c; Tests gegen HA 2026.11 (Beta ab ca. 28.10.) prüfen und den Test-Pin anheben, sobald verfügbar
- 1.e **(M)** Freigabe Phase 1

**Phase 2 – Card MVP**
- 2.a Gerüst: `card/` (TypeScript, Lit, Rollup), leere Card rendert, Bundle committet, CI-Check Bundle == Quellcode
- 2.b Auslieferung (`frontend.py`): Static Path, Lovelace-Ressource mit `?v=` ohne Duplikate, YAML-Fallback, Entfernen beim letzten Entry; Tests
- 2.c WebSocket-API `daily_challenge/list`, `/history`, `/set_day`; Tests
- 2.d Kernansicht: Kopfzeile (Icon, Name, Streak), Tageswert mit Fortschrittsring, Buttons −/+n, langer Druck für direkte Eingabe
- 2.e Soll/Ist-Zeile, Rest bis Ziel, Catch-up-Markierung, Historie neu laden bei Änderung von `total`
- 2.f Visueller Editor, `getStubConfig`, Card-Picker (`window.customCards`), Light/Dark-Theme
- 2.g Card-i18n EN/DE, Zahlenformat nach `hass.locale`
- 2.h **(M)** Test auf der eigenen HA-Instanz, Freigabe

**Phase 3 – Erster öffentlicher Release v0.1.0**
- 3.a Übersetzungen FR/IT (Integration und Card)
- 3.b Brand-Icons in `brand/`, `quality_scale.yaml`
  - Erster Logo-Entwurf vorhanden (Fortschrittsring mit Farbverlauf um eine Flamme, erzeugt mit `scripts/make_brand_icons.py`). Vom Maintainer abgenommen und leicht verfeinert (2026-10-23). `quality_scale.yaml` ist erledigt (alle Regeln von HA 2026.10 bewertet).
- 3.c README komplett, CHANGELOG.md
- 3.d Repo-Beschreibung, Topics, Issue-Templates; `hacs/action`-Job in `validate.yml` wieder aktivieren (ohne Ignores), muss grün sein
- 3.e **(M)** Repo öffentlich schalten, GitHub-Release v0.1.0 als normaler Release
- 3.e2 **(M)** PR an `hacs/default` vom Account `Skylolerr`, sobald HACS-Check und Release grün sind
- 3.f **(M)** Installation über HACS «Custom Repository» verifizieren

**Offene Zuarbeit des Maintainers bis v0.1.0** (Stand 2026-10-24; README, CHANGELOG und Issue-Templates sind fertig)

| # | Was | Wofür / Format |
|---|---|---|
| 1 | ~~Testergebnis Phase 1 inkl. Tageswechsel (1.c) und Freigabe (1.e)~~ – erledigt 2026-10-24: Tageswechsel auf der eigenen Instanz geprüft, Phase 1 vom Maintainer freigegeben | – |
| 2 | ~~Testergebnis Card (2.h) und Freigabe~~ – erledigt 2026-10-23: Card vom Maintainer freigegeben | – |
| 3 | ~~Screenshots~~ – erledigt 2026-10-23 (`docs/images/`: Card gerendert mit Testdaten, Einrichtungsformular vom Maintainer) | – |
| 4 | ~~Feedback zum Logo-Entwurf~~ – erledigt 2026-10-23: Entwurf gefällt, leicht verfeinert | – |
| 5 | ~~CI-Status im Actions-Tab~~ – erledigt 2026-10-23: Validate (Hassfest, Ruff/mypy, Card) und Tests grün | – |
| 6 | ~~Entscheidung Catch-up-Regel~~ – erledigt 2026-10-23: nur der Vortag kann aufgeholt werden, kein Vorarbeiten (§6) | – |
| 7 | ~~GitHub-Einstellungen: Beschreibung, Topics, Issues~~ – erledigt 2026-10-23 per `gh` | `hacs/action`-Job wird beim Öffentlich-Schalten wieder eingeschaltet (er prüft nur öffentliche Repos) |
| 8 | Repo öffentlich schalten, Release `v0.1.0` als normaler Release mit dem CHANGELOG-Text erstellen, danach PR an `hacs/default` | 3.e/3.e2; Tag-Check und ZIP laufen automatisch; PR nur nach ausdrücklichem OK |
| 9 | Installation über HACS «Custom Repository» auf der eigenen Instanz | 3.f; ersetzt die per `deploy.sh` kopierte Version |

**Phase 4 – v0.2.0**
- 4.a Heatmap (Wochen als Spalten, Montag oben, Intensität value/target, erfüllt/unerfüllt unterscheidbar, ausserhalb der Laufzeit grau)
  - Hinweis aus dem Review: `fulfilled` in der Historie kennt noch keinen Zustand «gestern noch rettbar» (Catch-up); für die Heatmap ergänzen. Gerundet wird mit Python-`round()` (2,25 → 2,2).
- 4.b Tag antippen → Dialog, Wert ändern via `set_day`
- 4.c Statistik-Zeile (Total, Ø/Tag, bester Tag, bester Streak)
- 4.d Editor-Optionen `show_heatmap`/`heatmap_range`, i18n in allen vier Sprachen
- 4.e Release v0.2.0 mit Changelog

**Phase 5 – v1.0.0**
- 5.a Feedback/Issues abarbeiten (Beta-Releases 0.2.x/0.3.x)
- 5.b Quality-Scale-Review: Silver vollständig, Gold soweit sinnvoll
- 5.c Stabilisierung: offene Breaking Changes bereinigen, Store-Migrationen prüfen, danach Entities/API eingefroren
- 5.d Release v1.0.0

### Später (nicht Teil von v1.0)

- Rückwirkend korrekte Long-Term-Statistics via `async_add_external_statistics` (mit `mean_type` und `unit_class`)
- «Höchstens»-Challenges (z. B. max. 1 Kaffee)
- Steigendes Tagesziel (z. B. +1 pro Woche)
- Tagesgrenze nach Mitternacht (z. B. Tag endet um 03:00)
- Import vergangener Daten (CSV / aus HA-Statistik)
- Calendar-Entity
- Challenge einer HA-Person zuordnen (Mehrbenutzer)
- Personal Bests / Podium, Habit-Score
