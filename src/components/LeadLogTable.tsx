"use client";

import { addHours, format } from "date-fns";
import { CalendarClock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { LeadRow } from "@/lib/types";

type LeadLogTableProps = {
  leads: LeadRow[];
  loading: boolean;
  onRecallShift: (leadId: string, dateIso: string) => Promise<void>;
};

function strengthStyles(value: LeadRow["lead_strength"]) {
  if (value === "strong") return "bg-emerald-100 text-emerald-700";
  if (value === "weak") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export default function LeadLogTable({
  leads,
  loading,
  onRecallShift,
}: LeadLogTableProps) {
  const [nowEpoch, setNowEpoch] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowEpoch(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Live Lead Log</h3>
          <p className="text-xs text-slate-500">Realtime CRM simulation powered by Supabase.</p>
        </div>
        {loading ? <RefreshCw className="h-4 w-4 animate-spin text-slate-500" /> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Strength</th>
              <th className="px-4 py-3">Comment</th>
              <th className="px-4 py-3">Recall</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  No leads yet. Trigger a web call or callback to populate this table.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const followUp = new Date(lead.follow_up_at);
                const overdue = followUp.getTime() < nowEpoch;

                return (
                  <tr key={lead.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.phone}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700">{lead.source.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${strengthStyles(lead.lead_strength)}`}
                      >
                        {lead.lead_strength}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{lead.comment}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <p className={overdue ? "text-xs font-semibold text-rose-600" : "text-xs text-slate-700"}>
                          {format(followUp, "dd MMM yyyy, HH:mm")}
                        </p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onRecallShift(lead.id, addHours(new Date(), 2).toISOString())
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            <CalendarClock className="h-3 w-3" />
                            +2h
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onRecallShift(lead.id, addHours(new Date(), 24).toISOString())
                            }
                            className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            +24h
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {typeof lead.call_duration_sec === "number" ? `${lead.call_duration_sec}s` : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {format(new Date(lead.created_at), "dd MMM, HH:mm")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
