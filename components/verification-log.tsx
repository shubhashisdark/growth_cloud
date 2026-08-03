"use client";

import { Check, X } from "lucide-react";
import type { ConnectionLog, LogStatus } from "@/lib/stores/integrations";

export function VerificationLog({ logs }: { logs: ConnectionLog[] }) {
  return (
    <div className="bg-[#070A14] border border-white/[0.08] rounded-xl p-4 mt-6">
      {logs.map((log) => (
        <LogItem key={log.id} message={log.message} status={log.status} />
      ))}
    </div>
  );
}

function LogItem({ message, status }: { message: string; status: LogStatus }) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-[13px] text-[#94A3B8]">
      {status === "success" && (
        <div className="w-[18px] h-[18px] rounded-full bg-[#34D399] flex items-center justify-center shrink-0">
          <Check className="w-2.5 h-2.5 text-[#0B0F1A]" />
        </div>
      )}
      {status === "error" && (
        <div className="w-[18px] h-[18px] rounded-full bg-[#F87171] flex items-center justify-center shrink-0">
          <X className="w-2.5 h-2.5 text-[#0B0F1A]" />
        </div>
      )}
      {(status === "pending" || !status) && (
        <div className="w-[18px] h-[18px] rounded-full bg-[#1A1F2E] border border-white/[0.08] shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
