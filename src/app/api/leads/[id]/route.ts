import { NextRequest, NextResponse } from "next/server";
import { validateServerEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { leadUpdateSchema } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  validateServerEnv();
  const { id } = await params;
  const json = await request.json();
  const parsed = leadUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const updates = parsed.data;
  const supabase = getSupabaseServerClient();

  const payload: Record<string, unknown> = {};
  if (updates.status) payload.status = updates.status;
  if (updates.leadStrength) payload.lead_strength = updates.leadStrength;
  if (updates.comment) payload.comment = updates.comment;
  if (updates.followUpAt) payload.follow_up_at = updates.followUpAt;
  if (typeof updates.callDurationSec === "number") {
    payload.call_duration_sec = updates.callDurationSec;
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Unable to update lead", details: error.message },
      { status: 500 },
    );
  }

  await supabase.from("lead_events").insert({
    lead_id: lead.id,
    event_type: "lead_updated",
    payload_json: payload,
  });

  return NextResponse.json({ lead });
}
