import { NextResponse } from "next/server";
import { validateServerEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { outboundStatusSchema } from "@/lib/types";

export async function POST(request: Request) {
  validateServerEnv();

  const authHeader = request.headers.get("authorization") ?? "";
  const expectedToken = process.env.OUTBOUND_STATUS_WEBHOOK_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized callback" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = outboundStatusSchema.safeParse(json);

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

  const leadUpdate: Record<string, unknown> = {
    status: input.status,
  };

  if (input.comment) {
    leadUpdate.comment = input.comment;
  }

  if (typeof input.callDurationSec === "number") {
    leadUpdate.call_duration_sec = input.callDurationSec;
  }

  const { error: leadError } = await supabase
    .from("leads")
    .update(leadUpdate)
    .eq("id", input.leadId);

  if (leadError) {
    return NextResponse.json(
      { error: "Unable to update lead status", details: leadError.message },
      { status: 500 },
    );
  }

  const { error: eventError } = await supabase.from("lead_events").insert({
    lead_id: input.leadId,
    event_type: input.eventType,
    payload_json: {
      status: input.status,
      comment: input.comment ?? null,
      callDurationSec: input.callDurationSec ?? null,
      ...input.payload,
    },
  });

  if (eventError) {
    return NextResponse.json(
      { error: "Unable to log lead event", details: eventError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
