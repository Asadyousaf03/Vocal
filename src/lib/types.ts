import { z } from "zod";

export const leadStrengthEnum = z.enum(["weak", "medium", "strong"]);
export const leadSourceEnum = z.enum(["web_call", "outbound"]);
export const leadStatusEnum = z.enum([
  "new",
  "callback_requested",
  "calling",
  "completed",
  "failed",
]);

const phoneSchema = z.preprocess(
  (value) =>
    typeof value === "string"
      ? value.replace(/[\s()-]/g, "")
      : value,
  z
    .string()
    .trim()
    .regex(/^(?:\+447\d{9}|07\d{9}|\+?92\d{10})$/, "Use a valid UK or Pakistan phone number"),
);

export const leadCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  phone: phoneSchema,
  source: leadSourceEnum.default("outbound"),
  status: leadStatusEnum.default("new"),
  leadStrength: leadStrengthEnum,
  comment: z.string().trim().min(3, "Comment is required"),
  followUpAt: z.string().datetime({ offset: true }),
  callDurationSec: z.number().int().nonnegative().optional(),
});

export const leadUpdateSchema = z.object({
  status: leadStatusEnum.optional(),
  leadStrength: leadStrengthEnum.optional(),
  comment: z.string().trim().min(3).optional(),
  followUpAt: z.string().datetime({ offset: true }).optional(),
  callDurationSec: z.number().int().nonnegative().optional(),
});

export const callEventSchema = z.object({
  leadId: z.string().uuid(),
  eventType: z.string().trim().min(2),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

export const outboundTriggerSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  phone: phoneSchema,
  leadStrength: leadStrengthEnum,
  comment: z.string().trim().min(3, "Comment is required"),
  followUpAt: z.string().datetime({ offset: true }),
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type OutboundTriggerInput = z.infer<typeof outboundTriggerSchema>;

export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  source: "web_call" | "outbound";
  status: "new" | "callback_requested" | "calling" | "completed" | "failed";
  lead_strength: "weak" | "medium" | "strong";
  comment: string;
  follow_up_at: string;
  call_duration_sec: number | null;
  created_at: string;
  updated_at: string;
};

export type LeadEventRow = {
  id: string;
  lead_id: string;
  event_type: string;
  payload_json: Record<string, unknown>;
  created_at: string;
};
