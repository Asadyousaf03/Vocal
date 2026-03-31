"use client";

import { addHours, format } from "date-fns";
import { Loader2, PhoneOutgoing, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type PhoneCallbackModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
};

function toLocalDateTimeInputValue(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export default function PhoneCallbackModal({
  open,
  onClose,
  onSubmitted,
}: PhoneCallbackModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [leadStrength, setLeadStrength] = useState<"weak" | "medium" | "strong">("medium");
  const [comment, setComment] = useState("");
  const [followUpAt, setFollowUpAt] = useState(toLocalDateTimeInputValue(addHours(new Date(), 2)));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(null);

  const validPhone = useMemo(() => /^(\+44|0)\d{9,10}$/.test(phone.trim()), [phone]);

  if (!open) {
    return null;
  }

  const reset = () => {
    setName("");
    setPhone("");
    setLeadStrength("medium");
    setComment("");
    setFollowUpAt(toLocalDateTimeInputValue(addHours(new Date(), 2)));
    setFeedback(null);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!validPhone) {
      setFeedback({ type: "error", message: "Enter a valid UK phone number (+44... or 0...)." });
      return;
    }

    if (!comment.trim()) {
      setFeedback({ type: "error", message: "A follow-up comment is required." });
      return;
    }

    if (!followUpAt) {
      setFeedback({ type: "error", message: "Follow-up date and time is required." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/outbound-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          leadStrength,
          comment,
          followUpAt: new Date(followUpAt).toISOString(),
        }),
      });

      const body = (await response.json()) as { error?: string; details?: string };

      if (!response.ok) {
        throw new Error(body.details || body.error || "Outbound trigger failed");
      }

      setFeedback({ type: "ok", message: "Outbound call request sent to Make.com" });
      await onSubmitted();
      setTimeout(() => {
        reset();
        onClose();
      }, 700);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Outbound request failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Test Outbound Speed</h2>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Lead Name</label>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[var(--apex-blue)] focus:ring"
              placeholder="e.g. Sarah Thompson"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Phone (UK)</label>
            <input
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[var(--apex-blue)] focus:ring"
              placeholder="+447700900123"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Lead Strength</label>
            <select
              value={leadStrength}
              onChange={(event) => setLeadStrength(event.target.value as "weak" | "medium" | "strong")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[var(--apex-blue)] focus:ring"
            >
              <option value="weak">Weak</option>
              <option value="medium">Medium</option>
              <option value="strong">Strong</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Comment (required)</label>
            <textarea
              required
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[var(--apex-blue)] focus:ring"
              placeholder="e.g. Warm lead, recall in 2 hours after tenant viewing"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Follow-up datetime</label>
            <input
              type="datetime-local"
              required
              value={followUpAt}
              onChange={(event) => setFollowUpAt(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[var(--apex-blue)] focus:ring"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFollowUpAt(toLocalDateTimeInputValue(addHours(new Date(), 2)))}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                +2h
              </button>
              <button
                type="button"
                onClick={() => setFollowUpAt(toLocalDateTimeInputValue(addHours(new Date(), 24)))}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                +24h
              </button>
            </div>
          </div>

          {feedback ? (
            <p className={feedback.type === "ok" ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
              {feedback.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOutgoing className="h-4 w-4" />}
            {isSubmitting ? "Sending..." : "Trigger Callback via Make"}
          </button>
        </form>
      </div>
    </div>
  );
}
