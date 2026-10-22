# Daily Challenge – Spezifikation

Home-Assistant-Custom-Integration (HACS / HA Marketplace) zum Tracken von täglichen, mengenbasierten Challenges (z. B. «20 Liegestütze pro Tag»), inkl. eigener Lovelace-Card.

- **Name:** Daily Challenge
- **Domain:** `daily_challenge`
- **Repo:** `skylolerlp/ha-daily-challenge` (privat während Phase 1–2, öffentlich ab dem ersten Beta-Release v0.1.0)
- **Lizenz:** MIT, Copyright skylolerlp
- **Mindestversion:** Home Assistant 2026.11.0
- **Sprachen:** EN (Basis), DE, FR, IT
- **Code, Kommentare, README, Commit-Messages:** Englisch

---

## 1. Positionierung

Es gibt bereits Habit-Tracker für HA (`habit_tracker`, `habit_log`). Daily Challenge grenzt sich ab durch:

- **Mengenziel pro Tag** statt Ja/Nein-Habit
- **Soll/Ist über die ganze Laufzeit** (Vorsprung/Rückstand, Rest bis Endziel)
- **Optionaler Catch-up-Modus** (Rückstand erhöht das heutige Ziel)
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
  "codeowners": ["@skylolerlp"],
  "config_flow": true,
  "dependencies": ["http", "frontend"],
  "after_dependencies": ["lovelace"],
  "documentation": "https://github.com/skylolerlp/ha-daily-challenge",
  "integration_type": "service",
  "iot_class": "calculated",
  "issue_tracker": "https://github.com/skylolerlp/ha-daily-challenge/issues",
  "requirements": [],
  "version": "0.1.0"
}
```

### hacs.json

```json
{
  "name": "Daily Challenge",
  "homeassistant": "2026.11.0",
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
- `deficit_until_yesterday`: `max(0, Σ target(d) − Σ value(d))` über `start_date … gestern`
- `effective_target_today`:
  - Modus `display`: `target(today)`
  - Modus `catch_up`: `target(today) + deficit_until_yesterday`
- `progress_today`: `value(today) / effective_target_today × 100`, auf 0–999 begrenzt
- `goal_reached_today`: `value(today) ≥ effective_target_today`
- Nur mit `end_date`: `end_target = Σ target(d)` über die ganze Laufzeit bis `end_date`. Daraus `remaining = max(0, end_target − total)`.
- `average_per_day`: `total / Anzahl vergangener Tage inkl. heute`
- `best_day`: maximaler Tageswert, das Datum kommt als Attribut dazu
- `this_week` / `this_month` / `this_year`: Summen. Die Woche beginnt am Montag (ISO).

**Tag erfüllt (für Streak):**
- `streak_rule = any`: `value(d) > 0`
- `streak_rule = target`, Modus `display`: `value(d) ≥ target(d)`
- `streak_rule = target`, Modus `catch_up`: Der Tag gilt als erfüllt, wenn **bis Ende des Folgetags** kein kumulierter Rückstand mehr besteht. Ein verpasster Tag lässt sich also am nächsten Tag «reparieren». Für `gestern` ist der Status vorläufig, bis `heute` vorbei ist. Er wird während heute als «noch rettbar» behandelt und bricht den Streak nicht.

**Streak:**
- `current_streak`: Anzahl aufeinanderfolgender erfüllter Tage bis gestern. Ist heute bereits erfüllt, zählt heute dazu. **Ein noch nicht erfüllter heutiger Tag bricht den Streak nicht.**
- `best_streak`: längste Serie in der gesamten Historie, inklusive Start- und Enddatum als Attribute.

Nach jeder Datenänderung, beim Tageswechsel und beim Start werden alle Kennzahlen neu berechnet. Das ist günstig genug: maximal ein paar tausend Tage.

---

## 7. Tageswechsel

- `async_track_time_change(hour=0, minute=0, second=0)` löst eine Neuberechnung aus und benachrichtigt die Entities.
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
- **Lovelace im Storage-Modus:** Die Ressource wird als Modul mit `?v=<manifest-version>` registriert. Eine bestehende Ressource mit anderer Version wird aktualisiert, sodass nie Duplikate entstehen.
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
show_heatmap: true                 # ab Phase 4 (v0.2.0)
heatmap_range: year                # year | 6months | 3months
```

- `getStubConfig()` wählt die erste vorhandene Challenge.
- `getConfigElement()` liefert einen visuellen Editor mit Challenge-Dropdown (`daily_challenge/list`) und Optionen.
- Die Card trägt sich in `window.customCards` ein, damit sie im Card-Picker erscheint.
- Die Card übernimmt die Theme-Variablen von HA und funktioniert im Light- und Dark-Mode.

### Inhalt (Phase 2, MVP)

- Kopfzeile mit Icon, Name und Streak (🔥 aktuell / Best)
- Grosser Tageswert mit Fortschrittsring gegen `effective_target_today`. Bei erreichtem Ziel wird der Ring in Erfolgsfarbe ganz gefüllt.
- Buttons: «−» und je ein «+n» pro Step. Ein langer Druck auf den Wert öffnet ein Eingabefeld für einen direkten Wert.
- Soll/Ist-Zeile: «Ist 1'240 / Soll 1'200 · +40». Mit Enddatum zusätzlich «Noch 3'100 bis Ziel».
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
   - Repo öffentlich schalten, GitHub-Release v0.1.0 als Pre-Release
   - Installation über HACS «Custom Repository» auf der eigenen Instanz verifizieren
4. **Phase 4 – v0.2.0:** Heatmap, Dialog zum Bearbeiten vergangener Tage, Statistik-Zeile.
5. **Phase 5 – v1.0.0:** Stabilisierung auf Basis von Feedback/Issues, keine Breaking Changes mehr ab hier, danach PR an `hacs/default` (vom Account `skylolerlp`, PR-Template vollständig).

**Versionierung:** SemVer. Vor 1.0 dürfen Minor-Releases Breaking Changes enthalten. Diese werden im CHANGELOG klar markiert. Store-Format-Änderungen laufen immer über eine Store-Migration, Nutzerdaten gehen nie verloren.

### Später (nicht Teil von v1.0)

- Rückwirkend korrekte Long-Term-Statistics via `async_add_external_statistics` (mit `mean_type` und `unit_class`)
- «Höchstens»-Challenges (z. B. max. 1 Kaffee)
- Steigendes Tagesziel (z. B. +1 pro Woche)
- Tagesgrenze nach Mitternacht (z. B. Tag endet um 03:00)
- Import vergangener Daten (CSV / aus HA-Statistik)
- Calendar-Entity
- Erinnerungs-Blueprint auf Basis von `goal_reached_today`
- Challenge einer HA-Person zuordnen (Mehrbenutzer)
- Personal Bests / Podium, Habit-Score
