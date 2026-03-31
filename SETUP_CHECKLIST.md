# Apex-Leads: Complete Setup Checklist

Use this checklist to verify everything is properly configured before going live.

---

## ✅ Part 1: Environment Setup

- [ ] Apex-Leads project folder: `d:\Projects\Vocal\apex-leads`
- [ ] Dependencies installed: `npm install` completed
- [ ] `.env.local` file created (copied from `.env.local.example`)

---

## ✅ Part 2: Supabase Configuration

### Create Supabase Project
- [ ] Signed up at [supabase.com](https://supabase.com)
- [ ] Created new project (name doesn't matter, use free tier)
- [ ] Copied **Project URL** to `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
  ```
- [ ] Copied **Anon Public Key** to `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
  ```
- [ ] Copied **Service Role Key** to `.env.local`:
  ```
  SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
  ```

### Create Database Tables
- [ ] Opened Supabase SQL Editor
- [ ] Copied entire SQL from `supabase/migrations/001_init_leads.sql`
- [ ] Pasted and executed in SQL Editor
- [ ] Confirmed `leads` table exists (check Tables menu)
- [ ] Confirmed `lead_events` table exists

### Enable Realtime
- [ ] Opened Supabase **Database** → **Replication**
- [ ] Under `supabase_realtime` publication:
  - [ ] Added `public.leads` table
  - [ ] Added `public.lead_events` table
- [ ] Status shows green checkmark next to both tables

---

## ✅ Part 3: Vapi Configuration

### Get Vapi Credentials
- [ ] Signed up at [vapi.ai](https://vapi.ai)
- [ ] Created or selected an Assistant
- [ ] Copied **Public Key** to `.env.local`:
  ```
  NEXT_PUBLIC_VAPI_PUBLIC_KEY=YOUR_VAPI_PUBLIC_KEY
  ```
- [ ] Copied **Assistant ID** to `.env.local`:
  ```
  NEXT_PUBLIC_VAPI_ASSISTANT_ID=YOUR_VAPI_ASSISTANT_ID
  ```

### (Optional) Customize Assistant
- [ ] Set assistant name to "Oliver" or similar for branding
- [ ] Set system instructions for UK property negotiation context
- [ ] Configure voice (UK accent recommended)
- [ ] Test with a quick call in Vapi dashboard

---

## ✅ Part 4: Make.com Webhook Setup

### Create Make Scenario
- [ ] Logged into [make.com](https://make.com)
- [ ] Created new scenario: "Apex-Leads Outbound Callback"
- [ ] Added **Webhooks** → **Custom Webhook** module
- [ ] Copied webhook URL from Make
- [ ] Pasted to `.env.local`:
  ```
  MAKE_COM_WEBHOOK_URL=https://hook.eu2.make.com/YOUR-WEBHOOK-ID
  ```

### Configure Webhook Payload
- [ ] In Make Custom Webhook, clicked "Set webhook"
- [ ] Pasted sample JSON:
  ```json
  {
    "leadId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Sarah Thompson",
    "phone": "+447700900123",
    "leadStrength": "strong",
    "comment": "Warm lead, callback after 2pm viewing",
    "followUpAt": "2026-03-31T16:30:00.000Z",
    "source": "apex-leads-dashboard"
  }
  ```
- [ ] Clicked **Save**

### (Optional) Add Downstream Modules
- [ ] To log callbacks: Added **Google Sheets** or **Airtable** module
- [ ] To make phone calls: Added **Twilio** → **Make a Phone Call** module
- [ ] To update Apex-Leads: Added **HTTP** → **Make a Request** module
  - Method: PATCH
  - URL: `https://your-apex-leads-app.vercel.app/api/leads/{{leadId}}`
  - Body: `{ "status": "calling" }`

### Enable Scenario
- [ ] Toggled **ON/OFF** to **ON** at bottom left
- [ ] Status shows green light (active)

---

## ✅ Part 5: Local Development

### Start the App
- [ ] Opened terminal in `apex-leads` folder
- [ ] Ran `npm run dev`
- [ ] Output shows: `▲ Next.js ... `
- [ ] Output shows: `- Local: http://localhost:3000`

### Verify Environment Load
- [ ] In browser, opened `http://localhost:3000`
- [ ] Page loads without errors
- [ ] Hero section visible with "24/7 UK Negotiator" headline
- [ ] Two CTA buttons visible: "Talk to Oliver" and "Test Outbound Speed"
- [ ] Check browser console (F12) - no red errors

---

## ✅ Part 6: Test Web Call Flow

1. [ ] Open `http://localhost:3000`
2. [ ] Click **"Talk to Oliver (Web Demo)"** button
3. [ ] Wait ~3 seconds for Vapi to connect
4. [ ] Status changes to "in_call" (confirmed)
5. [ ] Speak to the AI and hear a response
6. [ ] Click **"End Web Call"** button
7. [ ] Check the **Lead Log Table** (scroll down)
8. [ ] Verify:
   - [ ] New row appears with "Web Demo Lead"
   - [ ] Status shows "completed"
   - [ ] Strength shows "medium" (amber badge)
   - [ ] Comment shows "Web demo call initiated."
   - [ ] Duration shows a number (seconds)

---

## ✅ Part 7: Test Outbound Callback Flow

1. [ ] Click **"Test Outbound Speed"** button
2. [ ] Form modal opens
3. [ ] Fill form:
   - [ ] Name: "Test Lead"
   - [ ] Phone: "+447700900123"
   - [ ] Lead Strength: Select "strong" (green badge)
   - [ ] Comment: "Test callback - warm lead"
   - [ ] Follow-up: Leave default (+2h) or change
4. [ ] Click **"Trigger Callback via Make"**
5. [ ] Feedback shows: "Outbound call request sent to Make.com"
6. [ ] Check **Lead Log Table**:
   - [ ] New row appears with your test lead name
   - [ ] Status shows "calling" (or transitions from "callback_requested")
   - [ ] Strength badge shows "strong" (green)
   - [ ] Comment visible
   - [ ] Follow-up datetime visible

### Verify Make.com Received Webhook
1. [ ] Go to Make.com dashboard
2. [ ] Open your "Apex-Leads Outbound Callback" scenario
3. [ ] Click **Execution History** (bottom)
4. [ ] Look for a green checkmark (successful execution)
5. [ ] Click on it to see:
   - [ ] Incoming JSON (with your test lead data)
   - [ ] Module outputs (logs, Twilio call, etc.)

---

## ✅ Part 8: Test Lead Recall Actions

1. [ ] In the Lead Log table, find the "Test Lead" row
2. [ ] In the "Recall" column, click **"+2h"**
3. [ ] Check:
   - [ ] Follow-up datetime shifts to 2 hours later
   - [ ] Row updates within ~2 seconds (realtime)
4. [ ] Click **"+24h"**
5. [ ] Check:
   - [ ] Follow-up datetime shifts to 24 hours later
   - [ ] Table updates

---

## ✅ Part 9: Verify Database Rows

### In Supabase SQL Editor
1. [ ] Opened Supabase SQL Editor
2. [ ] Ran:
   ```sql
   SELECT * FROM leads ORDER BY created_at DESC LIMIT 5;
   ```
3. [ ] Confirm rows show:
   - [ ] Web demo lead (source: "web_call", call_duration_sec: number)
   - [ ] Test lead (source: "outbound", status: "calling", lead_strength: "strong")

4. [ ] Ran:
   ```sql
   SELECT * FROM lead_events ORDER BY created_at DESC LIMIT 10;
   ```
5. [ ] Confirm events show:
   - [ ] "lead_created" for each lead
   - [ ] "make_webhook_sent" for outbound lead

---

## ✅ Part 10: Final Smoke Tests

- [ ] Refresh the page (Cmd+R or Ctrl+R)
  - [ ] Lead Log persists (localStorage and Supabase work)
  - [ ] Leads still visible
- [ ] Open app in **two browser tabs**
  - [ ] Submit a new lead in Tab 1
  - [ ] Within 2 seconds, Tab 2 shows the new lead (realtime ✅)
- [ ] Test on mobile (browser DevTools → responsive design)
  - [ ] Modal form is readable
  - [ ] Lead Log table scrolls
  - [ ] Buttons are clickable

---

## ✅ Part 11: Production Readiness (Optional)

- [ ] Renamed `.env.local` to `.env.production.local` for production keys
- [ ] Confirmed build passes: `npm run build`
- [ ] Deployed to Vercel (or other Next.js host):
  - [ ] Added secrets to Vercel dashboard (NEXT_PUBLIC_* and private vars)
  - [ ] Verified live app at: `https://your-domain.vercel.app`
- [ ] Updated Make.com webhook to production URL

---

## ✅ Troubleshooting Checklist

### If leads don't appear in Lead Log
- [ ] Check browser console (F12) for errors
- [ ] Confirm `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Confirm Supabase tables exist (check SQL Editor)
- [ ] Confirm Realtime is enabled (check Replication menu)
- [ ] Check Supabase Realtime status (green or red indicator)

### If Vapi web call doesn't start
- [ ] Confirm Vapi Public Key and Assistant ID in `.env.local`
- [ ] Try generating new keys in Vapi dashboard
- [ ] Check browser console for Vapi SDK errors
- [ ] Ensure Vapi assistant status is "Active" in dashboard

### If Make webhook doesn't receive requests
- [ ] Confirm webhook URL is correct in `.env.local`
- [ ] Restart `npm run dev` after changing `.env.local`
- [ ] Test with curl (see MAKE_WEBHOOK_SETUP.md)
- [ ] Check Make Execution History for any requests received
- [ ] Confirm Make scenario is toggled ON

### If phone validation fails
- [ ] Ensure phone number starts with +44 or 0
- [ ] Ensure exactly 9-10 digits after prefix
- [ ] Example valid: `+447700900123` or `07700900123`

---

## ✅ Sign-Off

Once all boxes are checked, you have a **production-ready Apex-Leads MVP**:

- ✅ 24/7 AI voice negotiator demo (Vapi Web Call)
- ✅ Automated outbound callback trigger (Make.com webhook)
- ✅ Live CRM-style lead log (Supabase Realtime + React)
- ✅ Lead quality labels (Weak/Medium/Strong)
- ✅ Mandatory follow-up comments & recall scheduling
- ✅ Event audit trail (lead_events table)
- ✅ UK phone validation & GBP positioning

**Next step**: Deploy to production and share the link with MARKIA Ltd stakeholders for a live demo.
