"use client";

export function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-[#05070D] border border-white/[0.08] rounded-xl p-5 font-mono text-[13px] leading-relaxed text-[#94A3B8] overflow-x-auto">
      {children}
    </pre>
  );
}
