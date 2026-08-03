"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  variant?: "text" | "structured";
  structuredData?: {
    title?: string;
    items?: Array<{ label?: string; value: string }>;
    metrics?: Array<{ label: string; value: string; color?: string }>;
    actions?: string[];
  };
}

export function AIMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 mb-5",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-7 h-7 rounded-full bg-[#111827] border border-white/[0.08] flex items-center justify-center text-[11px] font-bold text-[#F1F5F9]">
            Y
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-[rgba(56,189,248,0.10)] border border-[rgba(56,189,248,0.2)] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-[#38BDF8] text-[#0B0F1A] rounded-br-none"
            : "bg-[#111827] border border-white/[0.08] text-[#F1F5F9] rounded-bl-none"
        )}
      >
        {message.variant === "structured" && message.structuredData ? (
          <StructuredContent data={message.structuredData} isUser={isUser} />
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
        <div
          className={cn(
            "text-[10px] mt-1.5 opacity-60",
            isUser ? "text-[#0B0F1A]/70" : "text-[#64748B]"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

function StructuredContent({
  data,
  isUser,
}: {
  data: NonNullable<ChatMessage["structuredData"]>;
  isUser: boolean;
}) {
  return (
    <div className="space-y-3">
      {data.title && (
        <div className="text-sm font-semibold">{data.title}</div>
      )}

      {data.items && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg px-3 py-2",
                isUser
                  ? "bg-[#0B0F1A]/10"
                  : "bg-[#0B0F1A]/50 border border-white/[0.06]"
              )}
            >
              {item.label && (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-0.5">
                  {item.label}
                </div>
              )}
              <div className="text-sm">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {data.metrics && data.metrics.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {data.metrics.map((m, i) => (
            <div
              key={i}
              className="bg-[#070A14]/50 rounded-lg px-3 py-2 border border-white/[0.06]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                {m.label}
              </div>
              <div
                className="text-lg font-bold mt-0.5"
                style={{
                  color: m.color || "#F1F5F9",
                  fontFamily: "var(--font-geist-sans), sans-serif",
                }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.actions && data.actions.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
            Suggested Actions
          </div>
          {data.actions.map((a, i) => (
            <div key={i} className="text-sm text-[#94A3B8] flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-[#38BDF8] mt-1.5 shrink-0" />
              {a}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-[rgba(56,189,248,0.10)] border border-[rgba(56,189,248,0.2)] flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
      </div>
      <div className="bg-[#111827] border border-white/[0.08] text-[#F1F5F9] rounded-2xl rounded-bl-none px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          <span className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
