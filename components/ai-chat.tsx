"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLeadsStore, aiSummary } from "@/lib/stores/leads";
import { useSegmentsStore, type SegmentRuleCheck } from "@/lib/stores/segments";
import { cn } from "@/lib/utils";
import { Loader2, Send, Sparkles } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
  variant?: "text" | "structured";
  structuredData?: {
    title?: string;
    items?: Array<{ label: string; value: string }>;
    metrics?: Array<{ label: string; value: string; color?: string }>;
    actions?: string[];
    summary?: string;
    probability?: number;
  };
}

function generateId() {
  return `msg_${Math.random().toString(36).slice(2, 9)}`;
}

function generateAssistantResponse(text: string, leads: ReturnType<typeof useLeadsStore.getState>["leads"]): { message: ChatMessage } {
  const lower = text.toLowerCase();

  if (lower.includes("subject line") || lower.includes("email copy") || lower.includes("subject")) {
    return {
      message: {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        variant: "structured",
        structuredData: {
          title: "Here are 3 subject line variations for your campaign:",
          items: [
            { label: "Curiosity", value: "The one thing your competitors aren't doing (yet)" },
            { label: "Urgency", value: "48 hours left: unlock AI-powered lead scoring" },
            { label: "Benefit-driven", value: "Ship campaigns 10x faster with Growth Cloud AI" },
          ],
          actions: [
            "Run an A/B test with all 3 variants",
            "Personalize the urgency variant for high-intent leads",
            "Schedule the campaign for Tuesday morning",
          ],
        },
      },
    };
  }

  if (lower.includes("summarize lead") || lower.includes("profile") || lower.includes("lead summary")) {
    const randomLead = leads[Math.floor(Math.random() * leads.length)];
    if (!randomLead) {
      return {
        message: {
          id: generateId(),
          role: "assistant",
          content: "I don't see any leads in your workspace yet. Try adding some leads first.",
          timestamp: new Date().toISOString(),
        },
      };
    }
    const summary = aiSummary(randomLead);
    return {
      message: {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        variant: "structured",
        structuredData: {
          title: `${randomLead.name} — ${randomLead.company}`,
          items: [
            { label: "Stage", value: randomLead.stage },
            { label: "Source", value: randomLead.source },
            { label: "Segments", value: randomLead.segments.join(", ") || "None" },
          ],
          metrics: [
            { label: "Lead Score", value: String(randomLead.score), color: randomLead.score >= 80 ? "#34D399" : randomLead.score >= 50 ? "#A78BFA" : "#38BDF8" },
            { label: "Conversion Probability", value: `${summary.probability}%`, color: summary.probability >= 80 ? "#34D399" : summary.probability >= 50 ? "#A78BFA" : "#FBBF24" },
          ],
          actions: [summary.summary],
          summary: summary.summary,
          probability: summary.probability,
        },
      },
    };
  }

  if (lower.includes("recommend") || lower.includes("next action") || lower.includes("what should i do")) {
    const sqlCount = leads.filter((l) => l.stage === "SQL").length;
    const mqlCount = leads.filter((l) => l.stage === "MQL").length;
    const highIntent = leads.filter((l) => l.score >= 70 && l.stage !== "Customer").length;
    return {
      message: {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        variant: "structured",
        structuredData: {
          title: "Recommended next actions",
          items: [
            { label: "SQLs", value: String(sqlCount) },
            { label: "MQLs", value: String(mqlCount) },
            { label: "High-intent leads", value: String(highIntent) },
          ],
          actions: [
            "Trigger the demo follow-up workflow for SQLs",
            "Move MQLs into the trial nurture segment",
            "Review the highest-intent leads in the dashboard",
          ],
        },
      },
    };
  }

  return {
    message: {
      id: generateId(),
      role: "assistant",
      content: "I can help with lead summaries, campaign copy, next-step recommendations, and segment ideas.",
      timestamp: new Date().toISOString(),
    },
  };
}

export function AIChat() {
  const leads = useLeadsStore((s) => s.leads);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const sendMessage = React.useCallback(() => {
    if (!input.trim()) return;
    setLoading(true);
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    const response = generateAssistantResponse(input, leads);
    setMessages((current) => [...current, userMessage, response.message]);
    setInput("");
    setLoading(false);
  }, [input, leads]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 text-[#F1F5F9]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-[#38BDF8]" />
        <div className="text-sm font-semibold">AI assistant</div>
      </div>

      <div className="space-y-3 max-h-[280px] overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <div className="text-sm text-[#64748B]">
            Ask for lead summaries, campaign copy, recommendations, or segment ideas.
          </div>
        ) : null}
        {messages.map((message) => (
          <div key={message.id} className={cn("rounded-xl px-4 py-3 text-sm", message.role === "assistant" ? "bg-[#0B0F1A] text-[#F1F5F9]" : "bg-[#1A1F2E] text-[#94A3B8]") }>
            {message.variant === "structured" && message.structuredData ? (
              <div className="space-y-2">
                {message.structuredData.title ? <div className="font-semibold text-[#F1F5F9]">{message.structuredData.title}</div> : null}
                {message.structuredData.items?.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#64748B]">{item.label}</span>
                    <span className="text-[#F1F5F9]">{item.value}</span>
                  </div>
                ))}
                {message.structuredData.metrics?.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#64748B]">{metric.label}</span>
                    <span style={{ color: metric.color ?? "#F1F5F9" }}>{metric.value}</span>
                  </div>
                ))}
                {message.structuredData.actions?.length ? (
                  <ul className="list-disc pl-5 text-xs text-[#94A3B8] space-y-1">
                    {message.structuredData.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              message.content
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the assistant..." className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9]" />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
