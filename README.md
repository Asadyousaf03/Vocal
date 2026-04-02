# Apex-Leads MVP

A Next.js App Router dashboard for MARKIA Ltd that demonstrates an AI Voice Negotiator for UK estate agency lead handling.

## What this MVP includes
- Hero landing section with CTA flows
- Talk to Oliver (Web Demo) button using Vapi Web SDK
- Test Outbound Speed modal posting to Make.com
- Live Lead Log table with realtime Supabase updates
- Lead quality labels (Weak, Medium, Strong)
- Mandatory follow-up comments and recall datetime

## Tech stack
- Next.js (App Router), TypeScript, Tailwind CSS
- `@vapi-ai/web` for browser voice calls
- Supabase for persistence and realtime updates
- Make.com for outbound callback automation
- Zod for payload validation

## Step-by-step setup
1. Install dependencies
   - `npm install`
2. Create environment file
   - Copy `.env.local.example` to `.env.local`
   - Fill in Vapi, Supabase, and Make values
3. Create Supabase tables
   - Open Supabase SQL Editor
   - Run SQL from `supabase/migrations/001_init_leads.sql`
4. Enable Realtime in Supabase
   - Confirm `leads` and `lead_events` are in publication `supabase_realtime`
5. Start dev server
   - `npm run dev`
6. Open app
   - Visit `http://localhost:3000`

## Make.com setup
1. Create a new Scenario in Make
2. Add Custom Webhook module as trigger
3. Set webhook URL in `MAKE_COM_WEBHOOK_URL`
4. Expected JSON payload from app:

```json
{
  "leadId": "uuid",
  "name": "Lead Name",
  "phone": "+447700900123",
  "leadStrength": "medium",
  "comment": "Recall in 2 hours",
  "followUpAt": "2026-03-30T14:00:00.000Z",
  "source": "apex-leads-dashboard"
}
```

## Vapi setup
1. Create or select assistant in Vapi dashboard
2. Copy Public Key and Assistant ID
3. Set:
   - `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
   - `NEXT_PUBLIC_VAPI_ASSISTANT_ID`

## API routes
- `GET /api/leads` load latest leads
- `POST /api/leads` create lead
- `PATCH /api/leads/:id` update lead status/strength/comment/follow-up
- `POST /api/outbound-call` create outbound lead + trigger Make
- `POST /api/outbound-status` secure callback endpoint for Make/Twilio/Vapi status updates
- `POST /api/call-events` append event timeline entries

## Development notes
- UK phone format validation accepts `+44` or `0` prefixes.
- Follow-up and comments are required fields for lead creation.
- Realtime updates are driven by Supabase channel subscriptions.

## Scripts
- `npm run dev` start local development
- `npm run build` production build check
- `npm run lint` linting
