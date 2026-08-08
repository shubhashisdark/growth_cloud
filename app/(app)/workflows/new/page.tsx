"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Plus, Trash2, ArrowDown, Save, RefreshCw, Play, Pause, Mail, Star, Tag, GitBranch, Bell, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import { useCreateWorkflow } from "@/hooks/useWorkflows";
import type { WorkflowStep } from "@/hooks/useWorkflows";
import { cn } from "@/lib/utils";

const TRIGGERS = [
  { value: "lead_created", label: "Lead Created" },
  { value: "lead_updated", label: "Lead Updated" },
  { value: "score_changed", label: "Score Changed" },
  { value: "stage_changed", label: "Stage Changed" },
  { value: "tag_added", label: "Tag Added" },
  { value: "form_submitted", label: "Form Submitted" },
  { value: "email_opened", label: "Email Opened" },
  { value: "email_clicked", label: "Email Clicked" },
  { value: "manual_trigger", label: "Manual Trigger" },
];

const ACTION_TYPES = [
  { value: "send_email", label: "Send Email", icon: Mail, color: "text-[#38BDF8]" },
  { value: "update_score", label: "Update Score", icon: Star, color: "text-yellow-400" },
  { value: "add_tag", label: "Add Tag", icon: Tag, color: "text-purple-400" },
  { value: "change_status", label: "Change Stage", icon: GitBranch, color: "text-emerald-400" },
  { value: "notify_sales", label: "Notify Sales", icon: Bell, color: "text-orange-400" },
  { value: "fire_webhook", label: "Fire Webhook", icon: Globe, color: "text-pink-400" },
];

const STEP_TYPES = [
  { value: "condition", label: "Condition", icon: GitBranch, color: "text-[#818CF8]" },
  { value: "action", label: "Action", icon: Zap, color: "text-[#38BDF8]" },
  { value: "delay", label: "Delay", icon: Pause, color: "text-yellow-400" },
];

type StepConfig = Record<string, unknown>;

type UIStep = {
  type: "condition" | "action" | "delay";
  actionType?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
  delayMinutes?: number;
  config?: StepConfig;
};

function StepCard({ step, index, onUpdate, onDelete }: {
  step: UIStep;
  index: number;
  onUpdate: (s: UIStep) => void;
  onDelete: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/8 bg-[#0D1117] p-4 space-y-3 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B] font-mono">Step {index + 1}</span>
          <div className="flex gap-1">
            {STEP_TYPES.map((t) => (
              <button key={t.value} onClick={() => onUpdate({ ...step, type: t.value as UIStep["type"] })}
                className={cn("text-xs px-2 py-0.5 rounded-full border transition-all",
                  step.type === t.value
                    ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]"
                    : "border-white/8 text-[#64748B] hover:border-white/20")}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onDelete} className="text-[#64748B] hover:text-[#F87171] transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {step.type === "action" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#64748B] mb-1 block">Action</label>
            <select value={step.actionType ?? "send_email"}
              onChange={(e) => onUpdate({ ...step, actionType: e.target.value })}
              className="w-full h-9 px-2 text-sm rounded-lg border border-white/8 bg-[#070A14] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40">
              {ACTION_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          {step.actionType === "send_email" && (
            <>
              <div>
                <label className="text-xs text-[#64748B] mb-1 block">Subject</label>
                <Input
                  value={(step.config?.subject as string) ?? ""}
                  onChange={(e) => onUpdate({ ...step, config: { ...step.config, subject: e.target.value } })}
                  placeholder="Welcome {{firstName}}!"
                  className="h-9 text-sm bg-[#070A14] border-white/8 text-[#F1F5F9]"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[#64748B] mb-1 block">Body</label>
                <textarea
                  value={(step.config?.body as string) ?? ""}
                  onChange={(e) => onUpdate({ ...step, config: { ...step.config, body: e.target.value } })}
                  placeholder="Hi {{firstName}}, welcome to Growth Cloud..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/8 bg-[#070A14] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40 resize-y"
                />
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Dynamic tags: {"{{firstName}}"}, {"{{lastName}}"}, {"{{fullName}}"}, {"{{email}}"},{" "}
                  {"{{company}}"}, {"{{score}}"}, {"{{lifecycleStage}}"}, {"{{tags}}"}, plus any custom field keys.
                </p>
              </div>
            </>
          )}
          {step.actionType === "update_score" && (
            <div>
              <label className="text-xs text-[#64748B] mb-1 block">Score Delta (+/-)</label>
              <Input type="number" value={(step.config?.delta as number) ?? 0}
                onChange={(e) => onUpdate({ ...step, config: { ...step.config, delta: Number(e.target.value) } })}
                className="h-9 text-sm bg-[#070A14] border-white/8 text-[#F1F5F9]" />
            </div>
          )}
          {step.actionType === "add_tag" && (
            <div>
              <label className="text-xs text-[#64748B] mb-1 block">Tag Name</label>
              <Input value={(step.config?.tag as string) ?? ""}
                onChange={(e) => onUpdate({ ...step, config: { ...step.config, tag: e.target.value } })}
                placeholder="e.g. hot-lead" className="h-9 text-sm bg-[#070A14] border-white/8 text-[#F1F5F9]" />
            </div>
          )}
          {step.actionType === "fire_webhook" && (
            <div>
              <label className="text-xs text-[#64748B] mb-1 block">Webhook URL</label>
              <Input value={(step.config?.url as string) ?? ""}
                onChange={(e) => onUpdate({ ...step, config: { ...step.config, url: e.target.value } })}
                placeholder="https://your-webhook.com" className="h-9 text-sm bg-[#070A14] border-white/8 text-[#F1F5F9]" />
            </div>
          )}
        </div>
      )}

      {step.type === "condition" && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-[#64748B] mb-1 block">Field</label>
            <select value={step.conditionField ?? "score"}
              onChange={(e) => onUpdate({ ...step, conditionField: e.target.value })}
              className="w-full h-9 px-2 text-sm rounded-lg border border-white/8 bg-[#070A14] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40">
              {["score","lifecycleStage","status","email","company","tags"].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#64748B] mb-1 block">Operator</label>
            <select value={step.conditionOperator ?? "gt"}
              onChange={(e) => onUpdate({ ...step, conditionOperator: e.target.value })}
              className="w-full h-9 px-2 text-sm rounded-lg border border-white/8 bg-[#070A14] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40">
              {["eq","neq","gt","gte","lt","lte","contains","not_contains"].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#64748B] mb-1 block">Value</label>
            <Input value={step.conditionValue ?? ""}
              onChange={(e) => onUpdate({ ...step, conditionValue: e.target.value })}
              placeholder="50" className="h-9 text-sm bg-[#070A14] border-white/8 text-[#F1F5F9]" />
          </div>
        </div>
      )}

      {step.type === "delay" && (
        <div className="grid grid-cols-2 gap-2 items-end">
          <div>
            <label className="text-xs text-[#64748B] mb-1 block">Delay (minutes)</label>
            <Input type="number" min={1} value={step.delayMinutes ?? 60}
              onChange={(e) => onUpdate({ ...step, delayMinutes: Number(e.target.value) })}
              className="h-9 text-sm bg-[#070A14] border-white/8 text-[#F1F5F9]" />
          </div>
          <p className="text-xs text-[#64748B] pb-2">Wait before running next step</p>
        </div>
      )}
    </motion.div>
  );
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const session = useAuthSessionStore((s) => s.session);
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";
  const createWorkflow = useCreateWorkflow();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("lead_created");
  const [status, setStatus] = useState<"active" | "paused">("paused");
  const [steps, setSteps] = useState<UIStep[]>([
    { type: "action", actionType: "send_email", config: { subject: "Welcome {{firstName}}!", body: "Hi {{firstName}}, welcome aboard!" } },
  ]);
  const [saving, setSaving] = useState(false);

  const addStep = () => setSteps((prev) => [...prev, { type: "action", actionType: "send_email" }]);

  const updateStep = (index: number, step: UIStep) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? step : s)));

  const deleteStep = (index: number) =>
    setSteps((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const definition = {
        trigger: { type: triggerType },
        steps: steps.map((s, i): WorkflowStep => ({
          index: i,
          type: s.type,
          actionType: s.actionType,
          conditionField: s.conditionField,
          conditionOperator: s.conditionOperator,
          conditionValue: s.conditionValue ? (isNaN(Number(s.conditionValue)) ? s.conditionValue : Number(s.conditionValue)) : undefined,
          delayMinutes: s.delayMinutes,
          config: s.config,
        })),
      };
      const wf = await createWorkflow.mutateAsync({ workspaceId, name, description, status, triggerType, definition });
      router.push(`/workflows/${wf.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A14] text-[#F1F5F9] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-1">Workflows / New</div>
            <h1 className="text-2xl font-bold">Workflow Builder</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.back()} className="text-[#64748B] hover:text-[#F1F5F9]">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}
              className="bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save Workflow
            </Button>
          </div>
        </motion.div>

        {/* Config */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/8 bg-[#0D1117] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#F1F5F9]">Basic Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-[#64748B] mb-1 block">Workflow Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Lead Nurture"
                className="h-10 bg-[#070A14] border-white/8 text-[#F1F5F9]" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#64748B] mb-1 block">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description"
                className="h-10 bg-[#070A14] border-white/8 text-[#F1F5F9]" />
            </div>
            <div>
              <label className="text-xs text-[#64748B] mb-1 block">Trigger</label>
              <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl border border-white/8 bg-[#070A14] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40">
                {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748B] mb-1 block">Initial Status</label>
              <div className="flex gap-2">
                {(["paused", "active"] as const).map((s) => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={cn("flex-1 h-10 text-sm rounded-xl border transition-all",
                      status === s ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]" : "border-white/8 text-[#64748B] hover:border-white/20")}>
                    {s === "active" ? <><Play className="w-3.5 h-3.5 inline mr-1" />Active</> : <><Pause className="w-3.5 h-3.5 inline mr-1" />Paused</>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Steps ({steps.length})</h2>
          </div>

          {/* Trigger indicator */}
          <div className="rounded-xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#38BDF8]" />
            <div>
              <div className="text-sm font-medium text-[#F1F5F9]">Trigger: {TRIGGERS.find((t) => t.value === triggerType)?.label}</div>
              <div className="text-xs text-[#64748B]">Workflow starts when this event fires</div>
            </div>
          </div>

          {steps.map((step, i) => (
            <React.Fragment key={i}>
              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-[#1E2538]" />
              </div>
              <StepCard step={step} index={i} onUpdate={(s) => updateStep(i, s)} onDelete={() => deleteStep(i)} />
            </React.Fragment>
          ))}

          <div className="flex justify-center pt-2">
            <Button onClick={addStep} variant="ghost"
              className="border border-dashed border-white/20 text-[#64748B] hover:border-[#38BDF8]/40 hover:text-[#38BDF8] w-full max-w-sm h-10 rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" /> Add Step
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
