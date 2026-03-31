# Apex-Leads MVP Scope (MARKIA Ltd)

## Problem
UK estate agencies lose high-intent leads when callbacks miss the 2-minute SLA, while admin handling costs remain high at GBP12.71/hour (National Living Wage benchmark).

## Solution
Apex-Leads provides AI triage and callback automation:
- AI voice negotiator available 24/7
- Browser web-call demo for instant testing
- Outbound callback trigger through Make.com
- Realtime lead log with strength labels and follow-up comments
- Cost profile target: ~GBP0.15/min AI triage

## Technology
- Frontend: Next.js App Router + Tailwind CSS + Lucide React
- Voice: Vapi Web SDK (`@vapi-ai/web`)
- Automation: Make.com webhook trigger
- Data: Supabase (`leads` and `lead_events`) with Realtime
- Model Context: GPT-4o-mini in operational stack design

## Compliance Positioning
- GDPR-ready workflow framing with controlled PII handling
- Audit-friendly lead event timeline for operational review
- UK tenancy domain orientation including Section 21 context and Renters' Rights Act 2026 readiness

## Lead Quality and Recall Workflow
Every lead captures:
- Strength label: weak, medium, strong
- Mandatory comment (e.g. "Recall in 2 hours")
- Mandatory follow-up datetime

## MVP Outcomes
- Demonstrable 2-minute SLA response capability
- Live CRM-style dashboard for stakeholder demos
- Clear path to production hardening (auth, RLS, analytics, observability)
