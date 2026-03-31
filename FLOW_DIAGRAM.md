# Apex-Leads End-to-End Flow

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      APEX-LEADS DASHBOARD                        │
│                    (http://localhost:3000)                       │
└──────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
        ┌───────────▼──────────┐   ┌─────────▼──────────┐
        │  "Talk to Oliver"    │   │ "Test Outbound     │
        │   (Web Demo)         │   │  Speed" (Form)     │
        │                      │   │                    │
        │ • Click button       │   │ • Enter: name      │
        │ • Vapi starts call   │   │ • Enter: phone     │
        │ • Lead auto-created  │   │ • Select: strength │
        │   (source:web_call)  │   │ • Enter: comment   │
        │ • On call end:       │   │ • Set: follow-up   │
        │   update duration    │   │ • Click: Submit    │
        └───────────┬──────────┘   └──────────┬─────────┘
                    │                         │
         POST /api/leads                POST /api/outbound-call
                    │                         │
        ┌───────────▼──────────┐   ┌─────────▼──────────┐
        │   SUPABASE (Leads)   │   │   SUPABASE (Leads) │
        │                      │   │                    │
        │ Create lead with:    │   │ Create lead with:  │
        │ • name: "Web Demo.." │   │ • name: (user)     │
        │ • status: "calling"  │   │ • status: "callback
        │ • source: web_call   │   │   _requested"      │
        │ • leadStrength: med  │   │ • source: outbound │
        │ • comment: pre-set   │   │ • leadStrength:    │
        │ • follow_up_at: +2h  │   │   (user selected)  │
        │                      │   │ • comment: (user)  │
        │ Log event:           │   │ • follow_up_at:    │
        │ "lead_created"       │   │   (user datetime)  │
        └───────────┬──────────┘   │                    │
                    │              │ ┌──────────────────┘
                    │              │ │
                    │              │ │ POST to MAKE_COM_WEBHOOK_URL
                    │              │ │ {
                    │              │ │   leadId, name, phone,
                    │              │ │   leadStrength, comment,
                    │              │ │   followUpAt, source
                    │              │ │ }
                    │              │ │
        REALtime    │              │ ▼
       Update       │         ┌────────────────────────┐
        Trigger     │         │   MAKE.COM WEBHOOK     │
                    │         │                        │
                    │         │ • Logs callback        │
                    │         │ • Optionally calls via │
                    │         │   Twilio               │
                    │         │ • Optionally updates   │
                    │         │   lead status back to  │
                    │         │   Apex-Leads API       │
                    │         │ • Logs to spreadsheet  │
                    │         └────────────────────────┘
                    │
        ┌───────────▼──────────┐
        │  LIVE LEAD LOG TABLE │
        │                      │
        │ Shows all leads with:│
        │ • Name & phone       │
        │ • Source (web/outb)  │
        │ • Status             │
        │ • Strength badge     │
        │ • Comment            │
        │ • Follow-up datetime │
        │ • Duration (if call) │
        │ • +2h/+24h actions   │
        └──────────────────────┘
```

---

## Data Flow: Outbound Callback (Complete Example)

```
1. USER SUBMITS FORM
   Input:
     name: "Sarah Thompson"
     phone: "+447700900123"
     leadStrength: "strong"
     comment: "Warm lead - call after property viewing"
     followUpAt: "2026-03-31T16:30:00.000Z"

2. FRONTEND VALIDATION
   ✓ Phone matches UK regex (/^(\+44|0)\d{9,10}$/)
   ✓ Comment is not empty
   ✓ Follow-up datetime is set
   → POST /api/outbound-call

3. BACKEND: CREATE LEAD
   POST /api/outbound-call receives payload
   ✓ Validates with Zod schema
   ✓ Inserts into "leads" table:
       {
         id: "550e8400...",
         name: "Sarah Thompson",
         phone: "+447700900123",
         source: "outbound",
         status: "callback_requested",
         lead_strength: "strong",
         comment: "Warm lead - call after property viewing",
         follow_up_at: "2026-03-31T16:30:00.000Z",
         created_at: "2026-03-31T14:00:00.000Z"
       }

4. BACKEND: LOG EVENT
   Insert into "lead_events":
       {
         lead_id: "550e8400...",
         event_type: "lead_created",
         payload_json: { source: "outbound", ... }
       }

5. BACKEND: TRIGGER MAKE WEBHOOK
   POST https://hook.eu2.make.com/your-webhook
   Body: {
     leadId: "550e8400...",
     name: "Sarah Thompson",
     phone: "+447700900123",
     leadStrength: "strong",
     comment: "Warm lead - call after property viewing",
     followUpAt: "2026-03-31T16:30:00.000Z",
     source: "apex-leads-dashboard"
   }

   If successful (200-299):
     → Update lead status to "calling"
     ✓ Log event: "make_webhook_sent"
     ✓ Return { ok: true, leadId, makeStatus }

   If failed (≥300):
     → Update lead status to "failed"
     ✓ Log event: "make_webhook_failed"
     ✓ Return error with details

6. MAKE.COM PROCESSES WEBHOOK
   Receives JSON
   → Optional: Makes Twilio call
   → Optional: Logs to Google Sheets
   → Optional: Hits /api/leads/:id for status update
   → Completes execution

7. FRONTEND: REALTIME UPDATE
   Supabase subscription fires
   ✓ Fetches updated leads list
   ✓ Lead Log table refreshes
   ✓ User sees new lead with:
     - Status: "calling" or "failed"
     - Strength: strong (green badge)
     - Comment visible
     - Follow-up datetime shown
     - +2h/+24h buttons available

8. USER ACTIONS
   • Click +2h → PATCH /api/leads/:id { followUpAt: now+2h }
   • Click +24h → PATCH /api/leads/:id { followUpAt: now+24h }
   • Status updates, event logged, table refreshes
```

---

## Status States

### Lead Status Lifecycle

```
web_call flow:
  "new" (default)
    ↓ (when Vapi starts)
  "calling" (during call)
    ↓ (on call end)
  "completed" (with duration)

outbound flow:
  "new" (default)
    ↓ (on form submit)
  "callback_requested" (awaiting Make)
    ↓ (if Make succeeds)
  "calling"
    ↓ (manual or Make-driven update)
  "completed" OR "failed"
```

### Lead Strength (User-Selected)

```
💚 strong    → Emerald green badge    (high intent)
🟡 medium    → Amber/yellow badge     (standard)
❌ weak      → Rose/red badge         (low intent, cold)
```

---

## API Contract Summary

### POST /api/leads (Web Call)
```
Request:
{
  name: string
  phone: UK format (+44 or 0)
  source: "web_call"
  status: "calling"
  leadStrength: "weak" | "medium" | "strong"
  comment: string (required)
  followUpAt: ISO datetime (required)
  callDurationSec?: number
}

Response (201):
{ lead: { id, name, phone, ... } }
```

### POST /api/outbound-call (Form Submit)
```
Request:
{
  name: string
  phone: UK format (+44 or 0)
  leadStrength: "weak" | "medium" | "strong"
  comment: string (required)
  followUpAt: ISO datetime (required)
}

Response (200/502):
{
  ok: true (or error),
  leadId: uuid,
  makeStatus: number
}
```

### PATCH /api/leads/:id (Status Update)
```
Request:
{
  status?: "new" | "callback_requested" | "calling" | "completed" | "failed"
  leadStrength?: "weak" | "medium" | "strong"
  comment?: string
  followUpAt?: ISO datetime
  callDurationSec?: number
}

Response (200):
{ lead: { id, name, phone, status, ... } }
```

### POST /api/call-events (Event Timeline)
```
Request:
{
  leadId: uuid,
  eventType: string,
  payload?: object
}

Response (200):
{ ok: true }
```

---

## Realtime Triggers

The Lead Log subscribes to **two tables**:

1. **leads** - Any INSERT/UPDATE/DELETE
   - Updates lead status, names, follow-ups
2. **lead_events** - Any INSERT
   - Logs call start, make webhook sent, etc.

Both trigger a full refetch of the lead list, so the UI is always fresh.

---

## Summary: What Happens When User Clicks "Test Outbound"

1. ✅ Form opens
2. ✅ User fills name, phone, strength, comment, follow-up
3. ✅ User clicks "Trigger Callback via Make"
4. ✅ Frontend validates UK phone & required fields
5. ✅ Frontend calls `/api/outbound-call`
6. ✅ Backend creates lead with status "callback_requested"
7. ✅ Backend posts to Make webhook URL
8. ✅ Make receives and processes (log, call, etc.)
9. ✅ Lead status updates to "calling" in Supabase
10. ✅ Realtime subscription fires → Lead Log refreshes
11. ✅ User sees new row with strength badge, comment, follow-up datetime
12. ✅ User can click +2h/+24h to reschedule
13. ✅ Each action updates Supabase and refreshes the table

**That's the complete flow.**
