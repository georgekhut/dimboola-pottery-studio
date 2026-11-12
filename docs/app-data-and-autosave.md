# App Data & Autosave — Dimboola Pottery Workshop Manager
### Where class data lives, how it is saved, and what is (deliberately) not in the CRM

*Added 2026-11-12. Companion to `print-system-reference.md` (printing) and `zoho-flow-acuity-to-crm.md` (Acuity → CRM).*

## 1. Decision: pots live in the app, not Zoho CRM
- Zoho CRM is on the **Free Edition** (org 7007534492). Free has no custom modules, so the planned Pots / Shipments / Pot photo modules cannot exist. The paid subscription bought on 9 Nov 2026 is **Zoho Flow Standard only** (5,000 tasks/month, renews 2026-12-09).
- **Decision (12 Nov 2026): stay on Free.** Zoho CRM holds Contacts only (Flow 1). Pots, glazes, pot notes, Ship ticks, shipping addresses and carton counts are kept in the Workshop Manager and its Excel backups.
- Shelved: Pots module, Pots Rollup (Total Pots Made), Shipments, Pot photo. Revisit only if the CRM is upgraded.

## 2. Per-class autosave (one computer)
- Each class is one record in the browser's `localStorage`:
  - `dpws.classes.v1` — object keyed by an internal class id → `{id, savedAt, className, classDate, classTime, studioName, uid, students}`
  - `dpws.current.v1` — id of the class last open
- Changing the date or name renames the same record; **+ New class** creates a new one (the old one stays in the list).
- A 3-second check (`autosaveTick()`), plus `beforeunload` and `visibilitychange`, saves whenever a JSON snapshot differs from the last save. An empty class (no clients, no name) is not saved.
- On load, `autosaveInit()` reopens the last class. The **Saved Classes** panel (top of Class Setup) lists records newest-date first with Open / Delete (confirm) and shows "✓ Autosaved HH:MM".
- Storage is wrapped in try/catch; a failure shows a red warning instead of breaking the app.
- **Limits:** data is stored per browser profile on one computer only, never on GitHub. Clearing site data or changing browser loses it. **Back up now** (Excel export) after each class is the real safety copy. Cross-computer sync is not built.
- `students[]` fields persisted: `id, firstName, lastName, phone, email, postcode, note, source, acuityId, certCode, ship, shipAddress, cartons, pots[{description, clay, glaze, note}]`.

## 3. Glaze list (12 Nov 2026)
White gloss thick · White gloss thin · Green · Matt White · Matt White thin · Yellow Ash · Opal · Pink · Turquoise · Black-Brown · Blue on Black · George's pick.

Old names are migrated on load/restore by `GLAZE_RENAMES` (e.g. Moon White → White gloss, Bottle Green → Green, EC Matt → Matt White, EC Matt very thin → Matt White thin, Chrome Pink → Pink, Turquoise Matt → Turquoise, Black-Brown (Tenmoku) → Black-Brown). Horsley Matt and Blanc Cremeau have no new equivalent.
**Zoho:** the glaze picklists are not changed because there is no Pots module on Free.

## 4. Open items
- Flow 2 (roll export for the next class) not built.
- SemiBold (600) thermal test print outstanding.
- Booker-with-friends: app does not yet flag repeated names or expand an Acuity quantity into rows.
