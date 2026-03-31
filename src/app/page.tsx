"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, ChartNoAxesColumnIncreasing, Clock3 } from "lucide-react";
import LeadLogTable from "@/components/LeadLogTable";
import PhoneCallbackModal from "@/components/PhoneCallbackModal";
import VapiButton from "@/components/VapiButton";
import { getPublicEnv } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LeadRow } from "@/lib/types";

async function fetchLeadRows() {
  const response = await fetch("/api/leads", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to fetch leads");
  }

  const data = (await response.json()) as { leads: LeadRow[] };
  return data.leads;
}

export default function Home() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [loadError, setLoadError] = useState("");

  const env = useMemo(() => getPublicEnv(), []);

  async function refreshLeads() {
    setIsLoading(true);
    setLoadError("");
    try {
      const rows = await fetchLeadRows();
      setLeads(rows);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load leads");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshLeads();
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("apex-leads-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        async () => {
          await refreshLeads();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lead_events" },
        async () => {
          await refreshLeads();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function shiftRecall(leadId: string, dateIso: string) {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpAt: dateIso }),
    });
    await refreshLeads();
  }

  return (
    <div className="apex-grid-bg min-h-screen">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-[var(--apex-blue)] to-[#0096ff] p-8 text-white shadow-xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-white/90">MARKIA Ltd</p>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            The 24/7 UK Negotiator: Zero Missed Leads.
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-blue-100 sm:text-base">
            Solve the 2-minute SLA for UK property leads with AI voice triage, instant callback automation,
            and a live CRM-ready lead pipeline.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr]">
            <VapiButton
              publicKey={env.vapiPublicKey}
              assistantId={env.vapiAssistantId}
              onRefresh={refreshLeads}
            />
            <button
              type="button"
              onClick={() => setOpenModal(true)}
              className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Test Outbound Speed
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 inline-flex rounded-xl bg-blue-100 p-2 text-[var(--apex-blue)]">
              <Clock3 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">2-minute SLA</h2>
            <p className="text-sm text-slate-600">Every lead is captured and triaged before competitors call back.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 inline-flex rounded-xl bg-cyan-100 p-2 text-cyan-700">
              <ChartNoAxesColumnIncreasing className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Cost Advantage</h2>
            <p className="text-sm text-slate-600">AI triage at GBP0.15/min versus GBP12.71/hr admin burden.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <BellRing className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Compliance-aware</h2>
            <p className="text-sm text-slate-600">Built for GDPR-ready workflows and UK tenancy context including Section 21.</p>
          </article>
        </section>

        {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

        <LeadLogTable leads={leads} loading={isLoading} onRecallShift={shiftRecall} />
      </main>

      <PhoneCallbackModal open={openModal} onClose={() => setOpenModal(false)} onSubmitted={refreshLeads} />
    </div>
  );
}
