import { NextResponse } from "next/server";
import { validateServerEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { callEventSchema } from "@/lib/types";

export async function POST(request: Request) {
  validateServerEnv();
  const json = await request.json();
  const parsed = callEventSchema.safeParse(json);

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

  const { error } = await supabase.from("lead_events").insert({
    lead_id: input.leadId,
    event_type: input.eventType,
    payload_json: input.payload,
  });

  if (error) {
    return NextResponse.json(
      { error: "Unable to write call event", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
