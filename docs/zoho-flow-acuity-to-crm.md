# Zoho Flow 1 — Acuity Booking → Zoho CRM Contact

Status: **live and tested** (2 Nov 2026). Flow slug `acuity_booking_zoho_crm_contact` on flow.zoho.com.au (AU data centre).
Plan: Zoho Flow free tier (100 tasks/month, 5 flows). Each booking uses ~4–5 tasks.

## What it does

Every new Acuity appointment creates or updates a Zoho CRM Contact (matched on Email), fills the custom fields, and sets **First Class Date only when the contact is new**.

## Flow structure

1. **Appointment scheduled** (Acuity trigger, realtime)
2. **Fetch contact** (Zoho CRM) — looks up Email from the booking. A no-match does NOT stop the flow; it returns an empty Contact ID.
3. **Create or update contact** — main upsert (below).
4. **If else** — Fetch contact → Contact ID *is empty*.
5. **True branch only: Create or update contact** — sets First Name, Last Name, Email and **First Class Date**. False branch does nothing.

Note: the Fetch runs *before* the main upsert, so "Contact ID is empty" really means "contact did not exist before this booking".

## Field mapping (main upsert)

| CRM field | Source |
|---|---|
| First Name / Last Name | Acuity first / last name |
| Email | Acuity email |
| **Mobile** | Acuity Phone number (Phone is left empty on purpose, so SMS can use Mobile later) |
| Postcode (+ Mailing Zip) | Acuity form question "What is your home address post code?" (token `trigger.17405811`) |
| Acuity ID | text `A` + Appointment ID |
| Cert Code | Acuity Certificate |
| Source | "Acuity Booking" (fixed) |
| Latest Booking Date | Appointment Date, converted `MMMM d, yyyy` → `yyyy-MM-dd` |
| First Class Date | (True branch only) Appointment Date, same conversion |

Not mapped yet: Total Classes, Marketing Consent, Studio Notes.

## Behaviour confirmed by testing

- New email → contact created, First Class Date and Latest Booking Date both set.
- Same email again → same contact updated; First Class Date unchanged, Latest Booking Date moves to the new class date, Acuity ID and Cert Code move to the latest booking.
- Phone typed **without** leading zero (`417 566 425`) → `+61417566425`.
- Phone typed **with** leading zero (`0417 566 425`) → `+61417566425` (Acuity strips the zero). No clean-up step needed for Australian mobiles. Landlines and overseas numbers are untested.
- Names are overwritten by each booking (a different name on the same email renames the contact).

## Gotchas learned

- **Acuity ID is numeric** in the trigger payload; the CRM field is text and rejects a bare number (`Invalid input for Acuity_ID. The expected input type is text.`). Fix: put literal text before the token (`A` + token). A trailing space also works but is *not* trimmed, so use a visible prefix.
- **Date fields must be yyyy-MM-dd.** Acuity's Date arrives as "November 15, 2026". On each CRM date field use *Format date and time* → Use a Custom Value → `MMMM d, yyyy` → Apply. Every date field needs its own conversion (the second upsert failed until it got one).
- **Zoho switches a flow OFF after repeated failures** (20 in a row) and emails an alert. Fix the cause, then switch it back on. A booking made while the flow is off is not captured; replay it from History if needed.
- **Live flows need "Apply changes".** After editing a live flow, click Done on the step, then *Apply changes* → Apply, or the edit is only a draft.
- **Builder quirks:** dragging an action always appends to the end of the chain, or leaves an unconnected floating block. Connect by dragging from a block's output circle. If-else true branch is the right-hand circle.
- **Testing needs a real trigger.** Make dummy bookings with plus-addresses (`george+test1@georgekhut.com`); check the History tab for per-step input/output. Dummy bookings send real client emails and are not auto-deleted from Acuity or the CRM.

## Open items

1. Acuity's email field can contain several comma-separated addresses; the CRM may reject these. Untested. Consider using the first address only.
2. Marketing Consent: depends on whether the Acuity intake form has a consent question.
3. Total Classes, Studio Notes: unmapped.
4. Rule for names on existing contacts (currently overwritten on every booking).
5. Free-plan limit: 100 tasks/month — check against booking volume.
6. Test records to delete by hand in the CRM: TEST3 (george+test1), TEST4/TEST5 (george+test4), mob2 (george+mob2).
