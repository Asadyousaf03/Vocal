"use client";

import { useMemo, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { PhoneCall, PhoneOff } from "lucide-react";

type VapiButtonProps = {
  publicKey: string;
  assistantId: string;
  onRefresh: () => Promise<void>;
};

export default function VapiButton({
  publicKey,
  assistantId,
  onRefresh,
}: VapiButtonProps) {
  const vapiRef = useRef<{
    start: (assistant: string) => Promise<void>;
    stop: () => Promise<void>;
    on: (event: string, callback: (payload?: unknown) => void) => void;
  } | null>(null);

  const leadIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const [status, setStatus] = useState<"idle" | "connecting" | "in_call" | "ended" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const disabled = useMemo(
    () => !publicKey || !assistantId || status === "connecting",
    [assistantId, publicKey, status],
  );

  async function createWebLead() {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Web Demo Lead",
        phone: "+447000000001",
        source: "web_call",
        status: "calling",
        leadStrength: "medium",
        comment: "Web demo call initiated.",
        followUpAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Unable to create web lead");
    }

    const body = (await response.json()) as { lead: { id: string } };
    leadIdRef.current = body.lead.id;
  }

  async function patchLead(payload: Record<string, unknown>) {
    if (!leadIdRef.current) {
      return;
    }

    await fetch(`/api/leads/${leadIdRef.current}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function startCall() {
    try {
      setErrorMessage("");
      setStatus("connecting");
      startedAtRef.current = Date.now();

      if (!vapiRef.current) {
        const instance = new Vapi(publicKey) as unknown as {
          start: (assistant: string) => Promise<void>;
          stop: () => Promise<void>;
          on: (event: string, callback: (payload?: unknown) => void) => void;
        };
        vapiRef.current = instance;

        instance.on("call-start", async () => {
          await createWebLead();
          setStatus("in_call");
          await onRefresh();
        });

        instance.on("call-end", async () => {
          setStatus("ended");
          const duration = startedAtRef.current
            ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
            : 0;

          await patchLead({ status: "completed", callDurationSec: duration });
          await onRefresh();
        });

        instance.on("error", async (error) => {
          setStatus("error");
          setErrorMessage("Vapi call failed. Check your credentials and assistant setup.");
          await patchLead({ status: "failed", comment: `Vapi error: ${String(error)}` });
          await onRefresh();
        });
      }

      await vapiRef.current.start(assistantId);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to start call");
    }
  }

  async function stopCall() {
    if (!vapiRef.current) {
      return;
    }

    await vapiRef.current.stop();
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={status === "in_call" ? stopCall : startCall}
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--apex-blue)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--apex-blue-700)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "in_call" ? <PhoneOff className="h-4 w-4" /> : <PhoneCall className="h-4 w-4" />}
        {status === "in_call" ? "End Web Call" : "Talk to Oliver (Web Demo)"}
      </button>

      <p className="text-xs text-slate-600">
        Status: <span className="font-semibold">{status.replace("_", " ")}</span>
      </p>

      {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
    </div>
  );
}
