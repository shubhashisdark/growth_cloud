// "use client";

// import React from "react";

// import { getBackendUrl } from "@/lib/backend";

// export function BackendStatusCard() {
//   const [status, setStatus] = React.useState<"checking" | "ready" | "error">("checking");
//   const [message, setMessage] = React.useState("Checking your workspace connection...");

//   React.useEffect(() => {
//     let cancelled = false;

//     async function checkBackend() {
//       try {
//         const response = await fetch(getBackendUrl("/health"));
//         const payload = await response.json();
//         if (!cancelled) {
//           setStatus(response.ok ? "ready" : "error");
//           setMessage(response.ok ? `Your workspace is connected to ${payload?.data?.service ?? "the platform backend"}.` : "The platform reported an issue while connecting.");
//         }
//       } catch {
//         if (!cancelled) {
//           setStatus("error");
//           setMessage("Unable to reach the platform backend at localhost:4000.");
//         }
//       }
//     }

//     void checkBackend();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   return (
//     <div className="rounded-xl border border-white/[0.08] bg-[#111827] p-4 text-sm">
//       <div className="flex items-center justify-between">
//         <span className="font-semibold text-[#F1F5F9]">Platform status</span>
//         <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === "ready" ? "bg-emerald-500/10 text-emerald-400" : status === "error" ? "bg-rose-500/10 text-rose-400" : "bg-sky-500/10 text-sky-400"}`}>
//           {status === "ready" ? "Connected" : status === "error" ? "Offline" : "Checking"}
//         </span>
//       </div>
//       <p className="mt-2 text-[#94A3B8]">{message}</p>
//     </div>
//   );
// }