# Make.com Webhook Setup Guide for Apex-Leads

This guide walks you through setting up a Make.com webhook scenario to receive and process outbound callback requests from Apex-Leads.

## Prerequisites
1. Make.com account (free tier is sufficient for MVP)
2. `MAKE_COM_WEBHOOK_URL` from your Make scenario (you'll create this below)
3. Apex-Leads app already running or ready to start

---

## Step 1: Create a New Scenario in Make

1. Log into [make.com](https://make.com)
2. Click **Create a new scenario**
3. Name it: `Apex-Leads Outbound Callback`
4. Click **Create scenario**

---

## Step 2: Add the Webhook Trigger Module

1. Click the **empty circle** (module placeholder) in the canvas
2. Search for: `Webhooks` → Select **Webhooks**
3. Select **Custom Webhook**
4. Click **Add**

### 2a. Determine Webhook URL

1. In the Custom Webhook module, you'll see:
   - A field labeled "Webhook URL"
   - Click **Copy address to clipboard**
   - This is your `MAKE_COM_WEBHOOK_URL`

2. **Paste this URL into `apex-leads/.env.local`**:
   ```
   MAKE_COM_WEBHOOK_URL=https://hook.eu2.make.com/your-webhook-id-here
   ```

### 2b. Create a Sample Payload

Make needs to understand the JSON structure you'll send. We'll provide this:

1. Still in the Custom Webhook module, click **Set webhook**
2. A dialog opens asking for a sample payload
3. Copy and paste this exact JSON:

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

4. Click **Save**

---

## Step 3: Map the Payload Variables

Once you save, Make auto-generates field variables from the sample. You'll see:

- `leadId`
- `name`
- `phone`
- `leadStrength`
- `comment`
- `followUpAt`
- `source`

Later modules can reference these as `{{leadId}}`, `{{name}}`, etc.

---

## Step 4: Add a Twilio or Phone Module (Optional)

### Option A: Log the Callback (Simplest for MVP)
If you just want to record the callback:

1. Click the **`+` icon** after the webhook
2. Search: `Google Sheets` or `Airtable`
3. Select and log the callback data
4. This allows you to see all requests in a spreadsheet

### Option B: Send to Twilio (Recommended for Real Outbound)
If you have a Twilio account and want actual phone calls:

1. Click the **`+` icon** after the webhook
2. Search: **Twilio** → Select **Make a Phone Call**
3. Configure:
   - **From Number**: Your Twilio verified number
   - **To Number**: `{{phone}}` (from webhook)
   - **Twiml**: Optional; or leave empty for simple ring
4. Click **OK**

### Option C: Send Back to Apex-Leads (For Status Updates)
If you want to update the lead status in Apex-Leads after calling:

1. Click the **`+` icon** after the phone call
2. Search: **HTTP** → Select **Make a request**
3. Configure:
   - **Method**: PATCH
   - **URL**: `https://your-apex-leads-app.vercel.app/api/leads/{{leadId}}`
   - **Headers**: Key: `Content-Type`, Value: `application/json`
   - **Body**: 
     ```json
     {
       "status": "calling",
       "callDurationSec": null
     }
     ```
4. Click **OK**

---

## Step 5: Enable and Test

1. Click the **blue ON/OFF toggle** at the bottom left of the scenario
2. The scenario is now **Active** and listening for webhooks

### Test the Webhook

1. **Option A**: Use Postman or curl to send a test:
   ```bash
   curl -X POST https://hook.eu2.make.com/YOUR-WEBHOOK-ID \
     -H "Content-Type: application/json" \
     -d '{"leadId":"550e8400-e29b-41d4-a716-446655440000","name":"Test Lead","phone":"+447700900123","leadStrength":"medium","comment":"Test callback","followUpAt":"2026-03-31T16:30:00.000Z","source":"apex-leads-dashboard"}'
   ```

2. **Option B**: Use Apex-Leads dashboard:
   - Open http://localhost:3000
   - Click "Test Outbound Speed"
   - Fill in the form and submit
   - Check Make.com execution log to see the webhook was received

---

## Step 6: Verify in Execution History

1. In Make, click the **Execution History** tab (bottom of the page)
2. You should see a green checkmark if the webhook was received successfully
3. Click on the execution to see:
   - The incoming payload
   - Any module outputs
   - Whether subsequent modules (Twilio, etc.) succeeded

---

## Common Webhook Issues & Fixes

### Issue: Webhook not receiving requests
- **Check**: Is Make scenario toggled ON?
- **Check**: Is the webhook URL correctly copied to `.env.local`?
- **Check**: Did you restart the Apex-Leads dev server after updating `.env.local`?

### Issue: "Invalid JSON" error
- **Solution**: Ensure the payload from Apex-Leads exactly matches the structure (all fields present)
- **Check**: Look at the "Received Data" in Make's Execution History

### Issue: Twilio call fails
- **Check**: Is your Twilio number verified and active?
- **Check**: Is the phone number in valid E.164 format (e.g., `+447700900123`)?

### Issue: Status update fails in Apex-Leads
- **Check**: The `leadId` UUID must be valid and exist in Supabase
- **Check**: Your Apex-Leads app is running and accessible from the internet

---

## Minimal Working Scenario (MVP)

For the fastest MVP, here's the simplest setup:

```
Webhook (Custom) 
  ↓ (receives payload)
HTTP Request (PATCH /api/leads/:id) 
  ↓ (updates lead status to "calling")
Response Sent
```

This flow:
1. Receives the webhook from Apex-Leads
2. Updates the lead status in Supabase to "calling"
3. Returns success to the app

**That's it.** No external integration required for MVP.

---

## Production-Ready Scenario

For a full production setup:

```
Webhook (Custom) 
  ↓ (receives payload with name, phone, comment, etc.)
Twilio → Make a Phone Call
  ↓ (calls the prospect)
Google Sheets → Log the call attempt
  ↓ (records timestamp, status)
HTTP Request → Apex-Leads PATCH /api/leads/:id
  ↓ (updates lead with call result)
Response Sent to Apex-Leads
```

---

## Webhook Payload Reference

The Apex-Leads app sends this JSON on form submission:

```json
{
  "leadId": "uuid-string",
  "name": "Lead Name",
  "phone": "+447700900123",
  "leadStrength": "weak|medium|strong",
  "comment": "Follow-up note",
  "followUpAt": "ISO 8601 datetime string",
  "source": "apex-leads-dashboard"
}
```

You can use any of these fields in subsequent Make modules by referencing:
- `{{leadId}}`
- `{{name}}`
- `{{phone}}`
- `{{leadStrength}}`
- `{{comment}}`
- `{{followUpAt}}`
- `{{source}}`

---

## Next: Connect Apex-Leads to Make

Once your webhook scenario is active:

1. Copy the webhook URL from Make
2. Paste into `apex-leads/.env.local` as `MAKE_COM_WEBHOOK_URL`
3. Restart Apex-Leads dev server
4. Test the flow end-to-end

```bash
npm run dev
# App starts
# Open http://localhost:3000
# Click "Test Outbound Speed"
# Submit form
# Check Make.com Execution History for the webhook
```
