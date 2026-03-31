import { NextResponse } from "next/server";
import { validateServerEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { outboundTriggerSchema } from "@/lib/types";

export async function POST(request: Request) {
  validateServerEnv();
  const json = await request.json();
  const parsed = outboundTriggerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const supabase = getSupabaseServerClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      name: input.name,
      phone: input.phone,
      source: "outbound",
      status: "callback_requested",
      lead_strength: input.leadStrength,
      comment: input.comment,
      follow_up_at: input.followUpAt,
    })
    .select("*")
    .single();

  if (leadError) {
    return NextResponse.json(
      { error: "Unable to create outbound lead", details: leadError.message },
      { status: 500 },
    );
  }

  const webhookPayload = {
    leadId: lead.id,
    name: input.name,
    phone: input.phone,
    leadStrength: input.leadStrength,
    comment: input.comment,
    followUpAt: input.followUpAt,
    source: "apex-leads-dashboard",
  };

  const makeResponse = await fetch(process.env.MAKE_COM_WEBHOOK_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(webhookPayload),
  });

  const makeBody = await makeResponse.text();

  await supabase.from("lead_events").insert({
    lead_id: lead.id,
    event_type: makeResponse.ok ? "make_webhook_sent" : "make_webhook_failed",
    payload_json: {
      status: makeResponse.status,
      responseBody: makeBody,
    },
  });

  if (!makeResponse.ok) {
    await supabase.from("leads").update({ status: "failed" }).eq("id", lead.id);

    return NextResponse.json(
      {
        error: "Make webhook failed",
        leadId: lead.id,
        details: makeBody || `Status ${makeResponse.status}`,
      },
      { status: 502 },
    );
  }

  await supabase.from("leads").update({ status: "calling" }).eq("id", lead.id);

  return NextResponse.json({
    ok: true,
    leadId: lead.id,
    makeStatus: makeResponse.status,
  });
}
