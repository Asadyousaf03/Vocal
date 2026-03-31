import { NextResponse } from "next/server";
import { validateServerEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { leadCreateSchema } from "@/lib/types";

export async function GET() {
  validateServerEnv();
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: "Unable to load leads", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ leads: data });
}

export async function POST(request: Request) {
  validateServerEnv();
  const json = await request.json();
  const parsed = leadCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const input = parsed.data;

  const { data: lead, error: insertError } = await supabase
    .from("leads")
    .insert({
      name: input.name,
      phone: input.phone,
      source: input.source,
      status: input.status,
      lead_strength: input.leadStrength,
      comment: input.comment,
      follow_up_at: input.followUpAt,
      call_duration_sec: input.callDurationSec ?? null,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Unable to create lead", details: insertError.message },
      { status: 500 },
    );
  }

  await supabase.from("lead_events").insert({
    lead_id: lead.id,
    event_type: "lead_created",
    payload_json: {
      source: input.source,
      status: input.status,
      leadStrength: input.leadStrength,
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
