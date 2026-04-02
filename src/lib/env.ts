const requiredServerEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_VAPI_PUBLIC_KEY",
  "NEXT_PUBLIC_VAPI_ASSISTANT_ID",
  "MAKE_COM_WEBHOOK_URL",
  "OUTBOUND_STATUS_WEBHOOK_SECRET",
] as const;

export function validateServerEnv() {
  const missing = requiredServerEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Add them to .env.local.`,
    );
  }
}

export function getPublicEnv() {
  return {
    vapiPublicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "",
    vapiAssistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "",
  };
}
